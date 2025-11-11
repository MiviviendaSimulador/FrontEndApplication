import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { SimulationData, CalculationResults } from '../App';
import { calculateFinancialMetrics } from './FinancialCalculations';

interface CompareScenariosProps {
  baseScenario: { data: SimulationData; results: CalculationResults };
  onBack: () => void;
}

export function CompareScenarios({ baseScenario, onBack }: CompareScenariosProps) {
  const [cloneData, setCloneData] = useState<SimulationData>({ ...baseScenario.data });
  const [cloneResults, setCloneResults] = useState<CalculationResults>(baseScenario.results);

  const formatCurrency = (amount: number) => {
    const symbol = baseScenario.data.currency === 'PEN' ? 'S/' : '$';
    return `${symbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleRecalculate = async () => {
    const newResults = await calculateFinancialMetrics(cloneData);
    setCloneResults(newResults);
  };

  const updateCloneData = (updates: Partial<SimulationData>) => {
    setCloneData(prev => ({ ...prev, ...updates }));
  };

  const getDifference = (baseValue: number, cloneValue: number, isPercentage = false) => {
    const diff = cloneValue - baseValue;
    const diffPercent = baseValue !== 0 ? (diff / baseValue) * 100 : 0;
    
    return {
      absolute: diff,
      percentage: diffPercent,
      isPositive: diff > 0,
      formatted: isPercentage 
        ? `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`
        : `${diff > 0 ? '+' : ''}${formatCurrency(Math.abs(diff))}`
    };
  };

  const DifferenceIndicator = ({ baseValue, cloneValue, isPercentage = false }: { 
    baseValue: number; 
    cloneValue: number; 
    isPercentage?: boolean;
  }) => {
    const diff = getDifference(baseValue, cloneValue, isPercentage);
    
    if (Math.abs(diff.absolute) < 0.01) {
      return <span className="text-muted-foreground">Sin cambio</span>;
    }

    return (
      <div className="flex items-center gap-1">
        {diff.isPositive ? (
          <TrendingUp className="w-3 h-3 text-red-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-green-500" />
        )}
        <span className={diff.isPositive ? 'text-red-500' : 'text-green-500'}>
          {diff.formatted}
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver a Resultados
        </Button>
        <div>
          <h1>Comparar Escenarios</h1>
          <p className="text-muted-foreground mt-2">
            Compare diferentes configuraciones de su crédito
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Escenario Alternativo</CardTitle>
              <CardDescription>
                Ajuste los parámetros para comparar con el escenario base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clone-term">Plazo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clone-term"
                      type="number"
                      value={cloneData.term}
                      onChange={(e) => updateCloneData({ term: Number(e.target.value) })}
                      min="1"
                      className="flex-1"
                    />
                    <Select
                      value={cloneData.termType}
                      onValueChange={(value: 'years' | 'months') => updateCloneData({ termType: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="years">Años</SelectItem>
                        <SelectItem value="months">Meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clone-rate">Tasa (%)</Label>
                  <Input
                    id="clone-rate"
                    type="number"
                    value={cloneData.rate}
                    onChange={(e) => updateCloneData({ rate: Number(e.target.value) })}
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clone-downPayment">Cuota inicial</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {cloneData.downPaymentType === 'amount' 
                          ? (cloneData.currency === 'PEN' ? 'S/' : '$')
                          : '%'
                        }
                      </span>
                      <Input
                        id="clone-downPayment"
                        type="number"
                        className="pl-8"
                        value={cloneData.downPayment}
                        onChange={(e) => updateCloneData({ downPayment: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <Select
                      value={cloneData.downPaymentType}
                      onValueChange={(value: 'amount' | 'percentage') => updateCloneData({ downPaymentType: value })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Monto</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clone-gracePeriod">Período de gracia</Label>
                  <div className="flex gap-2">
                    <Select
                      value={cloneData.gracePeriodType}
                      onValueChange={(value: 'none' | 'partial' | 'total') => updateCloneData({ gracePeriodType: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                        <SelectItem value="total">Total</SelectItem>
                      </SelectContent>
                    </Select>
                    {cloneData.gracePeriodType !== 'none' && (
                      <Input
                        type="number"
                        placeholder="Meses"
                        value={cloneData.gracePeriodMonths}
                        onChange={(e) => updateCloneData({ gracePeriodMonths: Number(e.target.value) })}
                        min="0"
                        max="60"
                        className="w-20"
                      />
                    )}
                  </div>
                </div>
              </div>

              <Button onClick={handleRecalculate} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Recalcular
              </Button>
            </CardContent>
          </Card>
        </div>

        {}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Comparativa de Resultados</CardTitle>
              <CardDescription>
                Base vs Alternativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Alternativo</TableHead>
                    <TableHead className="text-right">Diferencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Cuota Mensual</TableCell>
                    <TableCell className="text-right">{formatCurrency(baseScenario.results.monthlyPayment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cloneResults.monthlyPayment)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.monthlyPayment} 
                        cloneValue={cloneResults.monthlyPayment} 
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Total Intereses</TableCell>
                    <TableCell className="text-right">{formatCurrency(baseScenario.results.totalInterest)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cloneResults.totalInterest)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.totalInterest} 
                        cloneValue={cloneResults.totalInterest} 
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">Monto Financiado</TableCell>
                    <TableCell className="text-right">{formatCurrency(baseScenario.results.financedAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cloneResults.financedAmount)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.financedAmount} 
                        cloneValue={cloneResults.financedAmount} 
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">TCEA</TableCell>
                    <TableCell className="text-right">{formatPercentage(baseScenario.results.tcea)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(cloneResults.tcea)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.tcea} 
                        cloneValue={cloneResults.tcea} 
                        isPercentage={true}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">TREA</TableCell>
                    <TableCell className="text-right">{formatPercentage(baseScenario.results.trea)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(cloneResults.trea)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.trea} 
                        cloneValue={cloneResults.trea} 
                        isPercentage={true}
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">VAN</TableCell>
                    <TableCell className="text-right">{formatCurrency(baseScenario.results.van)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cloneResults.van)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.van} 
                        cloneValue={cloneResults.van} 
                      />
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-medium">TIR</TableCell>
                    <TableCell className="text-right">{formatPercentage(baseScenario.results.tir)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(cloneResults.tir)}</TableCell>
                    <TableCell className="text-right">
                      <DifferenceIndicator 
                        baseValue={baseScenario.results.tir} 
                        cloneValue={cloneResults.tir} 
                        isPercentage={true}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6 flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => alert('Funcionalidad de guardado no implementada en demo')}
              className="flex-1"
            >
              Guardar Escenario
            </Button>
            <Button variant="outline" onClick={onBack} className="flex-1">
              Volver a Resultados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}