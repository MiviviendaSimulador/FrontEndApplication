import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Save, Copy, TrendingUp, DollarSign, Percent, Target, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CalculationResults, SimulationData } from '../App';
import { saveSimulation } from '../utils/supabase/client';

interface ResultsProps {
  results: CalculationResults;
  simulationData: SimulationData;
  onSaveBase: () => void;
  onCloneScenario: () => void;
  hasBaseScenario: boolean;
  userEmail: string;
}

export function Results({ results, simulationData, onSaveBase, onCloneScenario, hasBaseScenario, userEmail }: ResultsProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [simulationName, setSimulationName] = useState('');
  const [isBaseScenario, setIsBaseScenario] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const formatCurrency = (amount: number) => {
    const symbol = simulationData.currency === 'PEN' ? 'S/' : '$';
    return `${symbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleSaveSimulation = async () => {
    if (!simulationName.trim()) {
      setSaveError('Por favor ingrese un nombre para la simulación');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const savedSimulation = await saveSimulation({
        user_email: userEmail,
        name: simulationName.trim(),
        simulation_data: simulationData,
        results: results,
        is_base_scenario: isBaseScenario
      });

      if (savedSimulation) {
        setSaveSuccess('Simulación guardada exitosamente');
        setSimulationName('');
        setIsBaseScenario(false);

        // Si es escenario base, también guardarlo localmente
        if (isBaseScenario) {
          onSaveBase();
        }

        setTimeout(() => {
          setSaveDialogOpen(false);
          setSaveSuccess('');
        }, 2000);
      } else {
        setSaveError('Error al guardar la simulación');
      }
    } catch (error) {
      setSaveError('Error al guardar la simulación');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPeriodicCosts = results.totalPeriodicCosts || results.schedule.reduce((s, r) => s + r.totalPeriodicCosts, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Resultados de la Simulación</h1>
          <p className="text-muted-foreground mt-2">
            Análisis financiero completo de su crédito MiVivienda
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Simulación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Guardar Simulación</DialogTitle>
                <DialogDescription>
                  Ingrese un nombre para guardar esta simulación en su historial
                </DialogDescription>
              </DialogHeader>

              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{saveSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="simulation-name">Nombre de la simulación</Label>
                  <Input
                    id="simulation-name"
                    value={simulationName}
                    onChange={(e) => setSimulationName(e.target.value)}
                    placeholder="Ej: Casa en Lima Norte - Opción 1"
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-base-scenario"
                    checked={isBaseScenario}
                    onChange={(e) => setIsBaseScenario(e.target.checked)}
                    disabled={isSaving}
                    className="rounded"
                  />
                  <Label htmlFor="is-base-scenario">Marcar como escenario base</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveSimulation}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={onCloneScenario}
            disabled={!hasBaseScenario}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Clonar para Comparar
          </Button>
        </div>
      </div>

      {/* Indicadores financieros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TCEA</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(results.tcea)}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de Costo Efectivo Anual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TREA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(results.trea)}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de Rendimiento Efectivo Anual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VAN</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(results.van)}</div>
            <p className="text-xs text-muted-foreground">
              Valor Actual Neto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TIR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(results.tir)}</div>
            <p className="text-xs text-muted-foreground">
              Tasa Interna de Retorno
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen del préstamo */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resumen del Préstamo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Cuota Mensual</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(results.monthlyPayment)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Intereses</p>
              <p className="text-2xl font-bold">{formatCurrency(results.totalInterest)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto Financiado</p>
              <p className="text-2xl font-bold">{formatCurrency(results.financedAmount)}</p>
            </div>
          </div>
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo total en seguros y cargos periódicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-4">{formatCurrency(totalPeriodicCosts)}</div>
              <p className="text-xs text-muted-foreground mb-4">Suma acumulada de todos los costos periódicos del préstamo</p>

              {/* Desglose de costos */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Seguro de desgravamen</span>
                  <span className="text-sm font-medium">{formatCurrency(results.insuranceLife || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Seguro contra todo riesgo</span>
                  <span className="text-sm font-medium">{formatCurrency(results.insuranceRisk || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Portes / Gastos de adm.</span>
                  <span className="text-sm font-medium">{formatCurrency(results.periodicFees || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Cronograma de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Pagos</CardTitle>
          <CardDescription>
            Detalle mensual de su plan de pagos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">N°</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-right">Interés</TableHead>
                  <TableHead className="text-right">Amortización</TableHead>
                  <TableHead className="text-right">Desgrav.</TableHead>
                  <TableHead className="text-right">Riesgo</TableHead>
                  <TableHead className="text-right">Cargos Fijos</TableHead>
                  <TableHead className="text-right">Seguros/Cargos</TableHead>
                  <TableHead className="text-right">Cuota</TableHead>
                  <TableHead className="text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.schedule.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.payment}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.initialBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                    <TableCell className="text-right">
                      {row.amortization > 0 ? formatCurrency(row.amortization) : (
                        <Badge variant="secondary">Gracia</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.insuranceLife ? formatCurrency(row.insuranceLife) : formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{row.insuranceRisk ? formatCurrency(row.insuranceRisk) : formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{row.periodicFees ? formatCurrency(row.periodicFees) : formatCurrency(0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.totalPeriodicCosts)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.monthlyPayment - row.totalPeriodicCosts)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.finalBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}