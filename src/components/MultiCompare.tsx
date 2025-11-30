import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { SavedSimulation } from '../utils/supabase/client';

interface MultiCompareProps {
  simulations: SavedSimulation[];
  onBack: () => void;
}

export function MultiCompare({ simulations, onBack }: MultiCompareProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'PEN' ? 'S/' : '$';
    return `${symbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getBestValue = (values: number[], isLowerBetter: boolean = false) => {
    if (isLowerBetter) {
      return Math.min(...values);
    }
    return Math.max(...values);
  };

  const isBestValue = (value: number, bestValue: number) => {
    return Math.abs(value - bestValue) < 0.01;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al Historial
        </Button>
        <div>
          <h1>Comparación de Simulaciones</h1>
          <p className="text-muted-foreground mt-2">
            Comparando {simulations.length} simulaciones guardadas
          </p>
        </div>
      </div>

      {/* Resumen de escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{simulations.length > 3 ? 4 : simulations.length} gap-6 mb-8">
        {simulations.map((sim, index) => (
          <Card key={sim.id}>
            <CardHeader>
              <CardTitle className="text-sm">{sim.name}</CardTitle>
              <CardDescription className="text-xs">
                {new Date(sim.created_at).toLocaleDateString('es-PE')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Precio Vivienda</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(sim.simulation_data.propertyPrice, sim.simulation_data.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cuota Inicial</p>
                  <p className="text-sm">
                    {sim.simulation_data.downPaymentType === 'percentage' 
                      ? `${sim.simulation_data.downPayment}%`
                      : formatCurrency(sim.simulation_data.downPayment, sim.simulation_data.currency)
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plazo</p>
                  <p className="text-sm">
                    {sim.simulation_data.term} {sim.simulation_data.termType === 'years' ? 'años' : 'meses'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tasa</p>
                  <p className="text-sm">{sim.simulation_data.rate}% {sim.simulation_data.rateType}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla comparativa de resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa de Resultados Financieros</CardTitle>
          <CardDescription>
            Los mejores valores están resaltados en verde
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Métrica</TableHead>
                  {simulations.map((sim, index) => (
                    <TableHead key={sim.id} className="text-right">
                      Escenario {index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Cuota Mensual */}
                <TableRow>
                  <TableCell className="font-medium">Cuota Mensual</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.monthlyPayment);
                    const bestValue = getBestValue(values, true);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.monthlyPayment, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatCurrency(sim.results.monthlyPayment, sim.simulation_data.currency)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* Total Intereses */}
                <TableRow>
                  <TableCell className="font-medium">Total Intereses</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.totalInterest);
                    const bestValue = getBestValue(values, true);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.totalInterest, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatCurrency(sim.results.totalInterest, sim.simulation_data.currency)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* Monto Financiado */}
                <TableRow>
                  <TableCell className="font-medium">Monto Financiado</TableCell>
                  {simulations.map((sim) => (
                    <TableCell key={sim.id} className="text-right">
                      {formatCurrency(sim.results.financedAmount, sim.simulation_data.currency)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Valor BBP */}
                <TableRow>
                  <TableCell className="font-medium">Valor BBP</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.bbpValue || 0);
                    const bestValue = getBestValue(values, false);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.bbpValue || 0, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatCurrency(sim.results.bbpValue || 0, sim.simulation_data.currency)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* Monto del Préstamo */}
                <TableRow>
                  <TableCell className="font-medium">Monto del Préstamo</TableCell>
                  {simulations.map((sim) => (
                    <TableCell key={sim.id} className="text-right">
                      {formatCurrency(sim.results.loanAmount || 0, sim.simulation_data.currency)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Amortización Total */}
                <TableRow>
                  <TableCell className="font-medium">Amortización del Capital</TableCell>
                  {simulations.map((sim) => (
                    <TableCell key={sim.id} className="text-right">
                      {formatCurrency(sim.results.totalAmortization || 0, sim.simulation_data.currency)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* TCEA */}
                <TableRow>
                  <TableCell className="font-medium">TCEA</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.tcea);
                    const bestValue = getBestValue(values, true);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.tcea, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatPercentage(sim.results.tcea)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* TREA */}
                <TableRow>
                  <TableCell className="font-medium">TREA</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.trea);
                    const bestValue = getBestValue(values, false);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.trea, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatPercentage(sim.results.trea)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* VAN */}
                <TableRow>
                  <TableCell className="font-medium">VAN</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.van);
                    const bestValue = getBestValue(values, false);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.van, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatCurrency(sim.results.van, sim.simulation_data.currency)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* TIR */}
                <TableRow>
                  <TableCell className="font-medium">TIR</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.tir);
                    const bestValue = getBestValue(values, false);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.tir, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatPercentage(sim.results.tir)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>

                {/* Costos Periódicos Totales */}
                <TableRow>
                  <TableCell className="font-medium">Costos Periódicos Totales</TableCell>
                  {(() => {
                    const values = simulations.map(s => s.results.totalPeriodicCosts || 0);
                    const bestValue = getBestValue(values, true);
                    return simulations.map((sim) => (
                      <TableCell 
                        key={sim.id} 
                        className={`text-right ${isBestValue(sim.results.totalPeriodicCosts || 0, bestValue) ? 'bg-green-50 font-semibold text-green-700' : ''}`}
                      >
                        {formatCurrency(sim.results.totalPeriodicCosts || 0, sim.simulation_data.currency)}
                      </TableCell>
                    ));
                  })()}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de recomendación */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Análisis Recomendado</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const monthlyPayments = simulations.map(s => s.results.monthlyPayment);
            const totalInterests = simulations.map(s => s.results.totalInterest);
            const tceas = simulations.map(s => s.results.tcea);
            
            const bestMonthlyIdx = monthlyPayments.indexOf(Math.min(...monthlyPayments));
            const bestInterestIdx = totalInterests.indexOf(Math.min(...totalInterests));
            const bestTceaIdx = tceas.indexOf(Math.min(...tceas));
            
            return (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium">Cuota Mensual Más Baja</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">{simulations[bestMonthlyIdx].name}</span> con {formatCurrency(monthlyPayments[bestMonthlyIdx], simulations[bestMonthlyIdx].simulation_data.currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium">Menor Total de Intereses</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">{simulations[bestInterestIdx].name}</span> con {formatCurrency(totalInterests[bestInterestIdx], simulations[bestInterestIdx].simulation_data.currency)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="font-medium">TCEA Más Competitiva</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">{simulations[bestTceaIdx].name}</span> con {formatPercentage(tceas[bestTceaIdx])}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
