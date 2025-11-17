import { SimulationData, CalculationResults, ScheduleRow } from '../App';
import {BBPCalc, TipoDeVivienda} from "../domain/BBPCalc";

export async function calculateFinancialMetrics(data: SimulationData): Promise<CalculationResults> {
  // Calcular valores básicos
  const downPaymentAmount = data.downPaymentType === 'percentage' 
    ? (data.propertyPrice * data.downPayment / 100)
    : data.downPayment;
  
  const financedAmountBeforeBBP = data.propertyPrice - downPaymentAmount;
  
  // Calcular BBP (Bono Buen Pagador) - simulamos el cálculo
  //const bbp = calculateBBP(financedAmountBeforeBBP, data.currency);
  const bbp = await calculateBBP(data.propertyPrice, data.currency, data);
  const financedAmount = financedAmountBeforeBBP - bbp;

  // Convertir tasa a mensual
  const termInMonths = data.termType === 'years' ? data.term * 12 : data.term;
  const monthlyRate = calculateMonthlyRate(data.rate, data.rateType, data.capitalizationsPerYear);

  // Generar cronograma
  const schedule = generateSchedule(
    financedAmount,
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
  const monthlyPayment = schedule.find(row => row.amortization > 0)?.monthlyPayment || 0;

  const tcea = calculateTCEA(schedule, financedAmount);
  const trea = calculateTREA(tcea);
  const van = calculateVAN(schedule, monthlyRate);
  const tir = calculateTIR(schedule, financedAmount);

  // costos periódicos
  const totalInsuranceLife = schedule.reduce((s, r) => s + r.insuranceLife, 0);
  const totalInsuranceRisk = schedule.reduce((s, r) => s + r.insuranceRisk, 0);
  const totalPeriodicFees = schedule.reduce((s, r) => s + r.periodicFees, 0);
  const totalPeriodicCosts = schedule.reduce((s, r) => s + r.totalPeriodicCosts, 0);

  return {
    monthlyPayment,
    totalInterest,
    financedAmount,
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
/* Version anterior
function calculateBBP(financedAmount: number, currency: string): number {

  // Bono Buen Pagador - máximo 25,500 PEN o equivalente en USD
  const maxBBP = currency === 'PEN' ? 25500 : 7000; // Aproximado USD
  const bbpPercentage = 0.05; // 5% del monto financiado
  return Math.min(financedAmount * bbpPercentage, maxBBP);
}*/

/**
 * Aplica ajustes adicionales al BBP base en función del perfil del usuario.
 *
 * La idea es personalizar el resultado de forma controlada sin romper
 * la lógica central de BBPCalc ni los rangos oficiales. Todos los ajustes
 * son multiplicativos y acotados para evitar valores extremos.
 */
function applyUserProfileAdjustments(baseBBP: number, data: SimulationData): number {
  let adjustmentFactor = 1;

  // Ajuste por edad: se refuerza ligeramente el bono para adultos mayores
  if (typeof data.edad === 'number' && data.edad >= 60) {
    adjustmentFactor += 0.05; // +5%
  }

  // Ajuste por ubicación: zonas rurales o departamentos priorizados
  const departamentosPriorizados = [
    'Amazonas',
    'Apurímac',
    'Ayacucho',
    'Huancavelica',
    'Huánuco',
    'Loreto',
    'Madre de Dios',
    'Pasco',
    'Puno',
    'Ucayali',
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

/**
 * Calcula el Bono del Buen Pagador (BBP) utilizando BBPCalc como motor central
 * y aplicando ajustes suaves basados en el perfil del usuario.
 *
 * Pruebas manuales sugeridas (resultados relativos, no exactos):
 *
 * 1) Perfil base (joven, zona urbana, ingresos medios):
 *    - edad: 30, zona: 'urbana', ingresos: 3000, sin condiciones especiales.
 *    - Esperado: BBP = BBP base (factor ~1.00).
 *
 * 2) Adulto mayor en zona rural con ingresos bajos y familia numerosa:
 *    - edad: 65, zona: 'rural', ingresos: 1800,
 *      numeroIntegrantesHogar: 5, numeroMenores: 2,
 *      adultoMayor: true.
 *    - Esperado: BBP mayor que en el caso base (incremento relativo ~10-15%).
 *
 * 3) Persona desplazada con múltiples condiciones especiales:
 *    - personaDesplazada: true, personaConDiscapacidad: true,
 *      ingresos <= 2500.
 *    - Esperado: BBP > BBP del perfil base y <= 15% por encima del bono base
 *      retornado por BBPCalc.
 */
export async function calculateBBP(
  propertyPrice: number, // Se usa el valor de la vivienda, no el monto financiado
  currency: 'PEN' | 'USD',
  data: SimulationData // Se pasa todo el objeto para acceder a los nuevos campos
): Promise<number> {
  // Valores por defecto si no se proporcionan
  const tipoVivienda = data.tipoVivienda === 'Sostenible'
    ? TipoDeVivienda.Sostenible
    : TipoDeVivienda.Tradicional; // Por defecto Tradicional

  const ingresos = data.ingresos ?? 5000; // Valor seguro si no se capturó ingresos

  // Considerar adulto mayor por edad aunque no se marque explícitamente el checkbox
  const esAdultoMayor = (typeof data.edad === 'number' && data.edad >= 60) || data.adultoMayor === true;
  const personaDesplazada = data.personaDesplazada ?? false;
  const migrantesRetornados = data.migrantesRetornados ?? false;
  const personaConDiscapacidad = data.personaConDiscapacidad ?? false;

  // Crear instancia de BBPCalc usando el factory method
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

  // Calcular bono base
  const baseBBP = bbpCalc.CalculoDeBono();

  // Aplicar ajustes suaves según el perfil del usuario
  return applyUserProfileAdjustments(baseBBP, data);
}

function calculateMonthlyRate(rate: number, rateType: string, capitalizationsPerYear?: number): number {
  if (rateType === 'TEA') {
    // Convertir TEA a TEM: (1 + TEA)^(1/12) - 1
    return Math.pow(1 + rate / 100, 1 / 12) - 1;
  } else {
    // TNA: dividir entre capitalizaciones por año y luego mensualizar
    const periodicRate = rate / 100 / (capitalizationsPerYear || 12);
    const periodsPerMonth = (capitalizationsPerYear || 12) / 12;
    return Math.pow(1 + periodicRate, periodsPerMonth) - 1;
  }
}

function generateSchedule(
  financedAmount: number,
  monthlyRate: number,
  termInMonths: number,
  gracePeriodType: string,
  gracePeriodMonths: number,
  insuranceAndFees: number, // mantenido para compatibilidad (no usado en prorrateo principal)
  propertyPrice: number,
  seguroDesgravamenRate: number, // % anual
  seguroRiesgoRate: number, // % anual
  portesPerPeriod: number,
  adminFeesPerPeriod: number,
  periodicCommissionPerPeriod: number,
  periodicCostFrequencyPerYear: number,
  periodicRatesArePerPeriod: boolean
): ScheduleRow[] {
  const schedule: ScheduleRow[] = [];
  let balance = financedAmount;
  // Frecuencia y periodo en días asumidos (según instrucciones)
  const frecuenciaPago = periodicCostFrequencyPerYear || 12;
  const periodoEnDias = 360;
  // Tasas periódicas (convertir % anual a factor por periodo) o usar por período directo
  const TSD = periodicRatesArePerPeriod
    ? (seguroDesgravamenRate / 100)
    : (seguroDesgravamenRate / 100) * (frecuenciaPago / periodoEnDias);
  const TSR = periodicRatesArePerPeriod
    ? (seguroRiesgoRate / 100)
    : (seguroRiesgoRate / 100) * (frecuenciaPago / periodoEnDias);

  // Calcular cuota fija (después del período de gracia)
  const paymentsWithAmortization = termInMonths - (gracePeriodType === 'total' ? gracePeriodMonths : 0);
  const basePayment = gracePeriodType === 'none' || paymentsWithAmortization <= 0
    ? (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
      (Math.pow(1 + monthlyRate, termInMonths) - 1)
    : (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, paymentsWithAmortization)) / 
      (Math.pow(1 + monthlyRate, paymentsWithAmortization) - 1);

  for (let i = 1; i <= termInMonths; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    const initialBalance = balance;
    const interest = balance * monthlyRate;
    // Seguros y cargos periódicos
    const insuranceLife = initialBalance * TSD; // Seguro desgravamen sobre saldo inicial
    const insuranceRisk = propertyPrice * TSR; // Seguro riesgo sobre valor de la vivienda
    const periodicFees = portesPerPeriod + adminFeesPerPeriod + periodicCommissionPerPeriod; // Cargos fijos
    const totalPeriodicCosts = insuranceLife + insuranceRisk + periodicFees;
    
    let amortization = 0;
    let monthlyPayment = 0; // se calculará según tipo de gracia

    if (gracePeriodType === 'none' || i > gracePeriodMonths) {
      // Período normal o después de gracia
      amortization = basePayment - interest;
      monthlyPayment = basePayment + totalPeriodicCosts;
    } else if (gracePeriodType === 'partial') {
      // Período de gracia parcial - solo se pagan intereses
      amortization = 0;
      monthlyPayment = interest + totalPeriodicCosts;
    } else if (gracePeriodType === 'total') {
      // Período de gracia total - no se paga nada
      amortization = 0;
      monthlyPayment = totalPeriodicCosts; // Solo costos periódicos según nuevas reglas
    }

    balance = Math.max(0, balance - amortization);

    schedule.push({
      payment: i,
      date: date.toLocaleDateString('es-PE'),
      initialBalance,
      interest,
      amortization,
      insuranceAndFees: totalPeriodicCosts, // mantener compatibilidad: ahora representa total periódicos
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

function calculateTCEA(schedule: ScheduleRow[], financedAmount: number): number {
  // TCEA basado en flujos de caja
  const payments = schedule.map(row => row.monthlyPayment);
  let tcea = 0;
  
  // Método iterativo simplificado para encontrar TCEA
  for (let rate = 0.01; rate <= 2; rate += 0.001) {
    let npv = -financedAmount;
    for (let i = 0; i < payments.length; i++) {
      npv += payments[i] / Math.pow(1 + rate / 12, i + 1);
    }
    if (Math.abs(npv) < 1) {
      tcea = rate;
      break;
    }
  }
  
  return tcea * 100;
}

function calculateTREA(tcea: number): number {
  // TREA es similar a TCEA pero sin seguros ni comisiones
  // Para simplificar, asumimos TREA = TCEA * 0.9
  return tcea * 0.9;
}

function calculateVAN(schedule: ScheduleRow[], discountRate: number): number {
  // VAN con tasa de descuento igual a la tasa mensual
  return schedule.reduce((van, row, index) => {
    return van + row.monthlyPayment / Math.pow(1 + discountRate, index + 1);
  }, 0);
}

function calculateTIR(schedule: ScheduleRow[], initialInvestment: number): number {
  // TIR simplificado - retorna un valor aproximado
  const totalPayments = schedule.reduce((sum, row) => sum + row.monthlyPayment, 0);
  const months = schedule.length;
  
  // Aproximación: TIR anual ≈ ((totalPayments / initialInvestment)^(12/months) - 1) * 100
  return (Math.pow(totalPayments / initialInvestment, 12 / months) - 1) * 100;
}