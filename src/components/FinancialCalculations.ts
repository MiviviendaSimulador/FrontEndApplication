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
    data.insuranceAndFees
  );

  // Calcular métricas
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const monthlyPayment = schedule.find(row => row.amortization > 0)?.monthlyPayment || 0;

  const tcea = calculateTCEA(schedule, financedAmount);
  const trea = calculateTREA(tcea);
  const van = calculateVAN(schedule, monthlyRate);
  const tir = calculateTIR(schedule, financedAmount);

  return {
    monthlyPayment,
    totalInterest,
    financedAmount,
    tcea,
    trea,
    van,
    tir,
    schedule
  };
}
/* Version anterior
function calculateBBP(financedAmount: number, currency: string): number {

  // Bono Buen Pagador - máximo 25,500 PEN o equivalente en USD
  const maxBBP = currency === 'PEN' ? 25500 : 7000; // Aproximado USD
  const bbpPercentage = 0.05; // 5% del monto financiado
  return Math.min(financedAmount * bbpPercentage, maxBBP);
}*/

async function calculateBBP(
    propertyPrice: number,  // Cambiar: usar propertyPrice, no financedAmount
    currency: 'PEN' | 'USD',
    data: SimulationData  // Pasar todo el objeto para acceder a los nuevos campos
): Promise<number> {
    // Valores por defecto si no se proporcionan
    const tipoVivienda = data.tipoVivienda === 'Sostenible'
        ? TipoDeVivienda.Sostenible
        : TipoDeVivienda.Tradicional;  // Por defecto Tradicional

    const ingresos = data.ingresos || 5000;  // Valor fuera del rango del integrador (<= 4746)
    const adultoMayor = data.adultoMayor || false;
    const personaDesplazada = data.personaDesplazada || false;
    const migrantesRetornados = data.migrantesRetornados || false;
    const personaConDiscapacidad = data.personaConDiscapacidad || false;

    // Crear instancia de BBPCalc usando el factory method
    const bbpCalc = await BBPCalc.crear(
        propertyPrice,
        tipoVivienda,
        ingresos,
        adultoMayor,
        personaDesplazada,
        migrantesRetornados,
        personaConDiscapacidad,
        currency
    );

    // Calcular y retornar el bono
    return bbpCalc.CalculoDeBono();
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
  insuranceAndFees: number
): ScheduleRow[] {
  const schedule: ScheduleRow[] = [];
  let balance = financedAmount;
  const monthlyInsurance = insuranceAndFees / termInMonths;

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
    
    let amortization = 0;
    let monthlyPayment = monthlyInsurance;

    if (gracePeriodType === 'none' || i > gracePeriodMonths) {
      // Período normal o después de gracia
      amortization = basePayment - interest;
      monthlyPayment = basePayment + monthlyInsurance;
    } else if (gracePeriodType === 'partial') {
      // Período de gracia parcial - solo se pagan intereses
      monthlyPayment = interest + monthlyInsurance;
    } else if (gracePeriodType === 'total') {
      // Período de gracia total - no se paga nada
      monthlyPayment = 0;
    }

    balance = Math.max(0, balance - amortization);

    schedule.push({
      payment: i,
      date: date.toLocaleDateString('es-PE'),
      initialBalance,
      interest,
      amortization,
      insuranceAndFees: monthlyInsurance,
      monthlyPayment,
      finalBalance: balance
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