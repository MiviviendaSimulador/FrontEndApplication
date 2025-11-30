import { useState } from 'react';
import { LoginRegister } from './components/LoginRegister';
import { NewSimulation } from './components/NewSimulation';
import { Results } from './components/Results';
import { CompareScenarios } from './components/CompareScenarios';
import { SimulationHistory } from './components/SimulationHistory';
import { Navigation } from './components/Navigation';

export type SimulationData = {
  propertyPrice: number;
  downPayment: number;
  downPaymentType: 'amount' | 'percentage';
  currency: 'PEN' | 'USD';
  rateType: 'TEA' | 'TES' | 'TET' | 'TEM' | 'TNA';
  capitalizationPeriod?: 'anual' | 'semanal' | 'trimestral' | 'mensual'; // Solo para TNA
  rate: number;
  term: number;
  termType: 'years' | 'months';
  gracePeriodType: 'none' | 'partial' | 'total';
  gracePeriodMonths: number;
  insuranceAndFees: number;
  bbp?: number;

  // Costos iniciales
  notaryFees?: number; // Costes Notariales
  registrationFees?: number; // Costes Registrales
  appraisal?: number; // Tasación
  studyCommission?: number; // Comisión de estudio
  activationCommission?: number; // Comisión activación

  // Tasa de descuento (Cok) para VAN
  discountRate?: number; // Tasa de descuento TEA (Cok) %

    // Nuevos campos para BBPCalc
    tipoVivienda?: 'Tradicional' | 'Sostenible';  // Por defecto 'Tradicional'
    ingresos?: number;  // Ingresos del usuario
    adultoMayor?: boolean;
    personaDesplazada?: boolean;
    migrantesRetornados?: boolean;
    personaConDiscapacidad?: boolean;

    // Cargos actualizados
    seguroDesgravamenRate?: number; // % anual 
    seguroRiesgoRate?: number; // % anual 
    portesPerPeriod?: number; // monto fijo por periodo
    adminFeesPerPeriod?: number; // gastos administración por periodo
    periodicCommissionPerPeriod?: number; // comisión periódica por periodo
    periodicCostFrequencyPerYear?: number; // 12 mensual, 24 quincenal, 52 semanal
    periodicRatesArePerPeriod?: boolean; // si true, tasas ingresadas ya son por período
  // ==============================
  // Datos de perfil del cliente
  // ==============================
  // Tipo de vivienda declarada por el usuario para el cálculo del BBP
  tipoVivienda?: 'Tradicional' | 'Sostenible';
  // Ingresos mensuales del hogar (brutos) utilizados para validar elegibilidad y bonos
  ingresos?: number;
  // Edad del titular del crédito. Se usa para determinar si aplica condición de adulto mayor
  edad?: number;
  // Ubicación geográfica principal de la vivienda / hogar
  departamento?: string; // Departamento o región
  provincia?: string;    // Provincia (opcional)
  distrito?: string;     // Distrito o zona específica (opcional)
  // Clasificación de la zona donde se ubica la vivienda
  zona?: 'urbana' | 'rural';
  // Composición familiar básica
  numeroIntegrantesHogar?: number; // Número total de personas en el hogar
  numeroMenores?: number;          // Menores de 18 años en el hogar
  // Información socioeconómica complementaria del titular
  ocupacionPrincipal?: string;     // Ocupación o actividad económica principal
  nivelEducativo?: string;         // Nivel educativo máximo alcanzado
  nivelIngresoDeclarado?: 'bajo' | 'medio' | 'alto'; // Clasificación auto-declarada de nivel de ingreso
  // Condiciones especiales declaradas por el usuario
  adultoMayor?: boolean;
  personaDesplazada?: boolean;
  migrantesRetornados?: boolean;
  personaConDiscapacidad?: boolean;
};

export type CalculationResults = {
  monthlyPayment: number;
  totalInterest: number;
  financedAmount: number;
  tcea: number;
  trea: number;
  van: number;
  tir: number;
  schedule: ScheduleRow[];
  // Totales agregados de costos periódicos para resumen
  insuranceLife?: number; // suma seguros desgravamen
  insuranceRisk?: number; // suma seguros riesgo
  periodicFees?: number; // suma portes + gastos + comisión
  totalPeriodicCosts?: number; // suma total periódica acumulada
  bbpValue?: number; // Valor del Bono del Buen Pagador
  loanAmount?: number; // Monto del préstamo (incluye costos iniciales)
  totalAmortization?: number; // Amortización total del capital
};

export type ScheduleRow = {
  payment: number;
  date: string;
  initialBalance: number;
  interest: number;
  amortization: number;
  insuranceAndFees: number;
  monthlyPayment: number;
  finalBalance: number;
  insuranceLife: number; // Seguro de desgravamen
  insuranceRisk: number; // Seguro de riesgo
  periodicFees: number; // Portes + Gastos Adm + Comisión
  totalPeriodicCosts: number; // Suma total costos periódicos
};

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'simulation' | 'results' | 'compare' | 'history'>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [baseScenario, setBaseScenario] = useState<{ data: SimulationData; results: CalculationResults } | null>(null);

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData);
    setCurrentView('simulation');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
    setSimulationData(null);
    setResults(null);
    setBaseScenario(null);
  };

  const handleSimulationSubmit = (data: SimulationData, calculatedResults: CalculationResults) => {
    setSimulationData(data);
    setResults(calculatedResults);
    setCurrentView('results');
  };

  const handleLoadSimulation = (data: SimulationData, calculatedResults: CalculationResults) => {
    setSimulationData(data);
    setResults(calculatedResults);
    setCurrentView('results');
  };

  const handleSaveBaseScenario = () => {
    if (simulationData && results) {
      setBaseScenario({ data: simulationData, results });
    }
  };

  const handleCloneScenario = () => {
    if (baseScenario) {
      setCurrentView('compare');
    }
  };

  if (!user) {
    return <LoginRegister onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView as 'simulation' | 'results' | 'compare' | 'history'}
        onNavigate={setCurrentView}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="pt-16">
        {currentView === 'simulation' && (
          <NewSimulation onSubmit={handleSimulationSubmit} />
        )}

        {currentView === 'history' && user && (
          <SimulationHistory 
            userEmail={user.email}
            onLoadSimulation={handleLoadSimulation}
          />
        )}
        
        {currentView === 'results' && results && simulationData && user && (
          <Results 
            results={results}
            simulationData={simulationData}
            onSaveBase={handleSaveBaseScenario}
            onCloneScenario={handleCloneScenario}
            hasBaseScenario={!!baseScenario}
            userEmail={user.email}
          />
        )}
        
        {currentView === 'compare' && baseScenario && (
          <CompareScenarios 
            baseScenario={baseScenario}
            onBack={() => setCurrentView('results')}
          />
        )}
      </main>
    </div>
  );
}