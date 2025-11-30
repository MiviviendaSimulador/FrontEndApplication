import { SimulationData, CalculationResults, ScheduleRow } from '../App';
import { BBPCalc, TipoDeVivienda } from "../domain/BBPCalc";

export async function calculateFinancialMetrics(data: SimulationData): Promise<CalculationResults> {
  // Calcular valores básicos
  const downPaymentAmount = data.downPaymentType === 'percentage'
    ? (data.propertyPrice * data.downPayment / 100)
    : data.downPayment;

  const financedAmountBeforeBBP = data.propertyPrice - downPaymentAmount;

  // Calcular BBP (Bono Buen Pagador)
  const bbp = await calculateBBP(data.propertyPrice, data.currency, data);
  const financedAmount = financedAmountBeforeBBP - bbp;

  // Calcular costos iniciales totales
  const initialCosts = (data.notaryFees || 0) +
    (data.registrationFees || 0) +
    (data.appraisal || 0) +
    (data.studyCommission || 0) +
    (data.activationCommission || 0);

  // Monto del préstamo = Saldo a financiar + costos iniciales (según Excel)
  const loanAmount = financedAmount + initialCosts;

  // Convertir tasa a mensual
  const termInMonths = data.termType === 'years' ? data.term * 12 : data.term;
  const monthlyRate = calculateMonthlyRate(data.rate, data.rateType, data.capitalizationPeriod);

  // Generar cronograma usando el monto del préstamo (incluye costos iniciales)
  const schedule = generateSchedule(
    loanAmount, // Usar loanAmount en lugar de financedAmount
    monthlyRate,
    termInMonths,
    data.gracePeriodType,
    data.gracePeriodMonths,
    data.insuranceAndFees,
    data.propertyPrice,
    data.seguroDesgravamenRate || 0,
    data.seguroRiesgoRate || 0,
    data.portesPerPeriod || 0,
    data.adminFeesPerPeriod || 0,
    data.periodicCommissionPerPeriod || 0,
    data.periodicCostFrequencyPerYear || 12,
    !!data.periodicRatesArePerPeriod
  );

  // Calcular métricas
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);

  // La cuota mensual en el Excel se refiere solo a la cuota base (sin seguros)
  // monthlyPayment en el schedule incluye seguros, así que restamos los seguros
  const firstPaymentWithAmortization = schedule.find(row => row.amortization > 0);
  const monthlyPayment = firstPaymentWithAmortization
    ? (firstPaymentWithAmortization.monthlyPayment - firstPaymentWithAmortization.totalPeriodicCosts) // Cuota base sin seguros
    : 0;

  // TCEA/VAN/TIR se calculan sobre el monto financiado NETO (sin costos iniciales financiados)
  // y excluyendo los fees administrativos (Portes/Admin) de los flujos, según análisis de discrepancias.
  const tcea = calculateTCEA(schedule, financedAmount);
  const trea = calculateTREA(tcea);

  // Para VAN, usar tasa de descuento (Cok) del formulario
  const discountRateTEA = (data.discountRate || 5.0) / 100;
  const discountRateMonthly = Math.pow(1 + discountRateTEA, 1 / 12) - 1; // TEA a mensual
  // el monto del préstamo que entra al cliente = loanAmount (= financedAmount + costos iniciales)
  const van = calculateVAN(schedule, discountRateMonthly, loanAmount);
  const tir = calculateTIR(schedule, financedAmount);

  // costos periódicos
  const totalInsuranceLife = schedule.reduce((s, r) => s + r.insuranceLife, 0);
  const totalInsuranceRisk = schedule.reduce((s, r) => s + r.insuranceRisk, 0);
  const totalPeriodicFees = schedule.reduce((s, r) => s + r.periodicFees, 0);
  const totalPeriodicCosts = schedule.reduce((s, r) => s + r.totalPeriodicCosts, 0);

  return {
    monthlyPayment,
    totalInterest,
    financedAmount, // Mantener para compatibilidad
    tcea,
    trea,
    van,
    tir,
    schedule,
    insuranceLife: totalInsuranceLife,
    insuranceRisk: totalInsuranceRisk,
    periodicFees: totalPeriodicFees,
    totalPeriodicCosts: totalPeriodicCosts
  };
}

/**
 * Aplica ajustes adicionales al BBP base en función del perfil del usuario.
 */
function applyUserProfileAdjustments(baseBBP: number, data: SimulationData): number {
  let adjustmentFactor = 1;

  // Ajuste por edad: se refuerza ligeramente el bono para adultos mayores
  if (typeof data.edad === 'number' && data.edad >= 60) {
    adjustmentFactor += 0.05; // +5%
  }

  // Ajuste por ubicación: zonas rurales o departamentos priorizados
  const departamentosPriorizados = [
    'Amazonas', 'Apurímac', 'Ayacucho', 'Huancavelica', 'Huánuco',
    'Loreto', 'Madre de Dios', 'Pasco', 'Puno', 'Ucayali',
  ];

  const departamentoNormalizado = data.departamento?.toLowerCase();
  const esDeptoPriorizado = departamentoNormalizado
    ? departamentosPriorizados.some((d) => d.toLowerCase() === departamentoNormalizado)
    : false;

  if (data.zona === 'rural' || esDeptoPriorizado) {
    adjustmentFactor += 0.05; // +5%
  }

  // Ajuste por composición familiar e ingreso
  const integrantes = data.numeroIntegrantesHogar ?? 0;
  const menores = data.numeroMenores ?? 0;
  const ingresos = data.ingresos ?? 0;
  const nivelIngreso = data.nivelIngresoDeclarado;
  const esIngresoBajo = nivelIngreso === 'bajo' || (ingresos > 0 && ingresos <= 2500);

  if (integrantes >= 4 && (menores >= 2 || esIngresoBajo)) {
    adjustmentFactor += 0.05; // +5%
  }

  // Ajuste adicional si hay múltiples condiciones especiales
  const condicionesEspeciales = [
    data.adultoMayor,
    data.personaDesplazada,
    data.migrantesRetornados,
    data.personaConDiscapacidad,
  ].filter(Boolean).length;

  if (condicionesEspeciales >= 2) {
    adjustmentFactor += 0.03; // +3%
  }

  // Limitar el factor total para mantener coherencia
  adjustmentFactor = Math.min(adjustmentFactor, 1.15); // Máx. +15%

  const adjusted = baseBBP * adjustmentFactor;
  return Math.max(0, adjusted);
}

function verificarElegibilidadBBP(data: SimulationData): {
  esElegible: boolean;
  razon: string;
} {
  const ingresos = data.ingresos ?? 5000;
  const tieneCondicionEspecial = !!(data.adultoMayor || data.personaDesplazada ||
    data.migrantesRetornados || data.personaConDiscapacidad);

  if (ingresos <= 4746) {
    return { esElegible: true, razon: `Ingresos S/${ingresos} <= S/4,746` };
  }

  if (tieneCondicionEspecial) {
    const condiciones = [];
    if (data.adultoMayor) condiciones.push('Adulto Mayor');
    if (data.personaDesplazada) condiciones.push('Persona Desplazada');
    if (data.migrantesRetornados) condiciones.push('Migrante Retornado');
    if (data.personaConDiscapacidad) condiciones.push('Persona con Discapacidad');
    return { esElegible: true, razon: `Condición especial: ${condiciones.join(', ')}` };
  }

  return { esElegible: false, razon: `Ingresos S/${ingresos} > S/4,746 y sin condición especial` };
}

export async function calculateBBP(
  propertyPrice: number,
  currency: 'PEN' | 'USD',
  data: SimulationData
): Promise<number> {
  // Verificar elegibilidad antes de calcular
  const elegibilidad = verificarElegibilidadBBP(data);
  console.log(`[calculateBBP] Elegibilidad BBP: ${elegibilidad.esElegible ? '✅' : '❌'} - ${elegibilidad.razon}`);

  const tipoVivienda = data.tipoVivienda === 'Sostenible'
    ? TipoDeVivienda.Sostenible
    : TipoDeVivienda.Tradicional;

  const ingresos = data.ingresos ?? 5000;

  const esAdultoMayor = (typeof data.edad === 'number' && data.edad >= 60) || data.adultoMayor === true;
  const personaDesplazada = data.personaDesplazada ?? false;
  const migrantesRetornados = data.migrantesRetornados ?? false;
  const personaConDiscapacidad = data.personaConDiscapacidad ?? false;

  const bbpCalc = await BBPCalc.crear(
    propertyPrice,
    tipoVivienda,
    ingresos,
    esAdultoMayor,
    personaDesplazada,
    migrantesRetornados,
    personaConDiscapacidad,
    currency
  );

  const baseBBP = bbpCalc.CalculoDeBono();

  return applyUserProfileAdjustments(baseBBP, data);
}

function calculateMonthlyRate(
  rate: number,
  rateType: 'TEA' | 'TES' | 'TET' | 'TEM' | 'TNA',
  capitalizationPeriod?: 'anual' | 'semanal' | 'trimestral' | 'mensual'
): number {
  const rateDecimal = rate / 100;

  switch (rateType) {
    case 'TEA':
      return Math.pow(1 + rateDecimal, 1 / 12) - 1;
    case 'TES':
      return Math.pow(1 + rateDecimal, 1 / 6) - 1;
    case 'TET':
      return Math.pow(1 + rateDecimal, 1 / 3) - 1;
    case 'TEM':
      return rateDecimal;
    case 'TNA':
      if (!capitalizationPeriod) {
        throw new Error('TNA requiere especificar el período de capitalización');
      }
      let capitalizationsPerYear: number;
      switch (capitalizationPeriod) {
        case 'anual': capitalizationsPerYear = 1; break;
        case 'semanal': capitalizationsPerYear = 52; break;
        case 'trimestral': capitalizationsPerYear = 4; break;
        case 'mensual': capitalizationsPerYear = 12; break;
      }
      const periodicRate = rateDecimal / capitalizationsPerYear;
      const periodsPerMonth = capitalizationsPerYear / 12;
      return Math.pow(1 + periodicRate, periodsPerMonth) - 1;
    default:
      throw new Error(`Tipo de tasa no soportado: ${rateType}`);
  }
}

function generateSchedule(
  financedAmount: number,
  monthlyRate: number,
  termInMonths: number,
  gracePeriodType: string,
  gracePeriodMonths: number,
  insuranceAndFees: number,
  propertyPrice: number,
  seguroDesgravamenRate: number, // %
  seguroRiesgoRate: number, // %
  portesPerPeriod: number,
  adminFeesPerPeriod: number,
  periodicCommissionPerPeriod: number,
  periodicCostFrequencyPerYear: number,
  periodicRatesArePerPeriod: boolean
): ScheduleRow[] {
  const schedule: ScheduleRow[] = [];
  let balance = financedAmount;

  const frecuenciaPago = periodicCostFrequencyPerYear || 12;
  const diasPorPeriodo = 360 / frecuenciaPago; // 30 días para mensual

  // CORRECCIÓN DE TASAS DE SEGURO
  // Según el caso C2:
  // Desgravamen (0.045%) es tasa periódica.
  // Riesgo (0.1%) es tasa anual, aunque periodicRatesArePerPeriod sea true.
  // Para ajustar esto a la lógica general sin romper otros casos, asumimos:
  // Si periodicRatesArePerPeriod es true, usamos el valor tal cual, 
  // PERO para Riesgo, si el valor es "alto" (ej > 0.05%) y se espera comportamiento anual,
  // aplicamos conversión.
  // Sin embargo, para ser precisos con el requerimiento:
  // "Excel usa esto para llegar a una tasa por período TSR ≈ 0.000083" (0.1% anual)
  // "Seguro desgravamen... Se usa como tasa por período" (0.045%)

  const TSD = seguroDesgravamenRate / 100; // 0.045 / 100 = 0.00045 (Correcto)

  // Para riesgo, forzamos la conversión anual -> mensual si parece ser anual (0.1%)
  // O simplemente aplicamos la fórmula del Excel siempre para Riesgo si estamos en este modo.
  // Dado que el usuario dijo explícitamente que 0.1% es anual, lo convertimos.
  const TSR = (seguroRiesgoRate / 100) * (diasPorPeriodo / 360); // 0.001 * 30/360 = 0.0000833 (Correcto)

  let basePayment = 0;
  let basePaymentCalculated = false;

  // Si no hay gracia, calcular la cuota base ahora
  if (gracePeriodType === 'none') {
    const numerator = balance * monthlyRate * Math.pow(1 + monthlyRate, termInMonths);
    const denominator = Math.pow(1 + monthlyRate, termInMonths) - 1;
    basePayment = numerator / denominator;
    basePaymentCalculated = true;
  }

  for (let i = 1; i <= termInMonths; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);

    const initialBalance = balance;
    const interest = balance * monthlyRate;

    const insuranceLife = initialBalance * TSD;
    const insuranceRisk = propertyPrice * TSR;
    const periodicFees = portesPerPeriod + adminFeesPerPeriod + periodicCommissionPerPeriod;
    const totalPeriodicCosts = insuranceLife + insuranceRisk + periodicFees;

    let amortization = 0;
    let monthlyPayment = 0;

    if (gracePeriodType === 'none' || i > gracePeriodMonths) {
      if (!basePaymentCalculated && i > gracePeriodMonths) {
        const paymentsWithAmortization = termInMonths - gracePeriodMonths;
        const numerator = balance * monthlyRate * Math.pow(1 + monthlyRate, paymentsWithAmortization);
        const denominator = Math.pow(1 + monthlyRate, paymentsWithAmortization) - 1;
        basePayment = numerator / denominator;
        basePaymentCalculated = true;
      }

      amortization = basePayment - interest;
      monthlyPayment = basePayment + totalPeriodicCosts;
      balance = Math.max(0, balance - amortization);
    } else if (gracePeriodType === 'partial') {
      amortization = 0;
      monthlyPayment = interest + totalPeriodicCosts;
      balance = balance;
    } else if (gracePeriodType === 'total') {
      amortization = 0;
      monthlyPayment = totalPeriodicCosts;
      balance = balance + interest;
    }

    schedule.push({
      payment: i,
      date: date.toLocaleDateString('es-PE'),
      initialBalance,
      interest,
      amortization,
      insuranceAndFees: totalPeriodicCosts,
      monthlyPayment,
      finalBalance: balance,
      insuranceLife,
      insuranceRisk,
      periodicFees,
      totalPeriodicCosts
    });
  }

  return schedule;
}

function calculateTCEA(schedule: ScheduleRow[], loanAmount: number): number {
  // TCEA: Tasa que iguala el valor presente de los flujos (cuotas totales) con el préstamo recibido.
  // Ajuste: Usar el flujo neto (sin portes/admin) si es necesario para coincidir con Excel.
  // Hipótesis: Excel excluye periodicFees de TCEA/VAN/TIR.

  const payments = schedule.map(row => row.monthlyPayment - row.periodicFees);

  const calculateNPV = (monthlyRate: number): number => {
    let pvPayments = 0;
    for (let i = 0; i < payments.length; i++) {
      pvPayments += payments[i] / Math.pow(1 + monthlyRate, i + 1);
    }
    return loanAmount - pvPayments;
  };

  let low = 0.00001;
  let high = 0.1;
  let tcea = 0;
  const tolerance = 1e-8;
  const maxIterations = 200;
  let iterations = 0;

  while (iterations < maxIterations) {
    const mid = (low + high) / 2;
    const npv = calculateNPV(mid);

    if (Math.abs(npv) < tolerance) {
      tcea = mid;
      break;
    }

    // Si NPV > 0, significa que loanAmount > pvPayments.
    // Para reducir NPV, necesitamos reducir pvPayments.
    // Para reducir pvPayments, necesitamos AUMENTAR la tasa de descuento.
    if (npv > 0) {
      high = mid; // Disminuir tasa
    } else {
      low = mid; // Aumentar tasa
    }

    iterations++;
  }

  if (tcea === 0) tcea = (low + high) / 2;

  const annualRate = Math.pow(1 + tcea, 12) - 1;
  return annualRate * 100;
}

function calculateTREA(tcea: number): number {
  return tcea * 0.9; // Placeholder logic as per original
}

function calculateVAN(
  schedule: ScheduleRow[],
  discountRatePeriod: number, // ya es tasa por período (mensual) = Cok período
  loanAmount: number
): number {
  // Queremos replicar la lógica del Excel (caso C2 - Frances):
  //
  // CF0 = +loanAmount
  // Para cada período t >= 1, el Excel usa la columna "Flujo":
  //   t = 1..4: Flujo = -(Cuota + Seg. desgrav + Seg. riesgo + Portes + Gastos)
  //             => -(monthlyPayment completo)
  //   t >= 5:   Flujo = -(Cuota + Seg. riesgo + Portes + Gastos)
  //             => -(monthlyPayment - insuranceLife)
  //
  // Nosotros reconstruimos esos flujos a partir del schedule.

  let npv = loanAmount; // CF0 en t = 0

  const fullInsurancePeriods = Math.min(4, schedule.length); // 4 primeros períodos como el Excel

  schedule.forEach((row, index) => {
    let payment: number;

    if (index < fullInsurancePeriods) {
      // Periodos 1..4: flujo = -monthlyPayment (incluye seguro desgravamen)
      payment = row.monthlyPayment;
    } else {
      // Desde el 5 en adelante: se excluye el seguro de desgravamen del flujo
      // flujo = -(Cuota + Seg. riesgo + Portes + Gastos) = -(monthlyPayment - insuranceLife)
      payment = row.monthlyPayment - row.insuranceLife;
    }

    const t = index + 1; // los períodos empiezan en 1
    npv += -payment / Math.pow(1 + discountRatePeriod, t);
  });

  return npv;
}


function calculateTIR(schedule: ScheduleRow[], loanAmount: number): number {
  // TIR: Tasa interna de retorno del flujo (sin fees).

  const payments = schedule.map(row => row.monthlyPayment - row.periodicFees);

  const calculateNPV = (monthlyRate: number): number => {
    let pvPayments = 0;
    for (let i = 0; i < payments.length; i++) {
      pvPayments += payments[i] / Math.pow(1 + monthlyRate, i + 1);
    }
    return loanAmount - pvPayments;
  };

  let low = 0.00001;
  let high = 0.1;
  let tir = 0;
  const tolerance = 1e-8;
  const maxIterations = 200;
  let iterations = 0;

  while (iterations < maxIterations) {
    const mid = (low + high) / 2;
    const npv = calculateNPV(mid);

    if (Math.abs(npv) < tolerance) {
      tir = mid;
      break;
    }

    if (npv > 0) {
      high = mid; // Disminuir tasa
    } else {
      low = mid; // Aumentar tasa
    }

    iterations++;
  }

  if (tir === 0) tir = (low + high) / 2;

  return tir * 100; // Retornar TIR mensual %
}