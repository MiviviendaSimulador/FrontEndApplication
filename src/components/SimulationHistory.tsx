import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Eye, Trash2, AlertCircle, Clock, DollarSign, GitCompare, X, Edit } from 'lucide-react';
import { getUserSimulations, deleteSimulation, SavedSimulation } from '../utils/supabase/client';
import { SimulationData, CalculationResults } from '../App';

interface SimulationHistoryProps {
  userEmail: string;
  onLoadSimulation: (data: SimulationData, results: CalculationResults) => void;
  onCompareSimulations?: (simulations: SavedSimulation[]) => void;
  onEditSimulation?: (data: SimulationData) => void;
}

export function SimulationHistory({ userEmail, onLoadSimulation, onCompareSimulations, onEditSimulation }: SimulationHistoryProps) {
  const [simulations, setSimulations] = useState<SavedSimulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSimulations();
  }, [userEmail]);

  const loadSimulations = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userSimulations = await getUserSimulations(userEmail);
      setSimulations(userSimulations);
    } catch (error) {
      setError('Error al cargar el historial de simulaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (simulationId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta simulación?')) {
      return;
    }

    setDeletingId(simulationId);
    try {
      const success = await deleteSimulation(simulationId);
      if (success) {
        setSimulations(simulations.filter(sim => sim.id !== simulationId));
      } else {
        setError('Error al eliminar la simulación');
      }
    } catch (error) {
      setError('Error al eliminar la simulación');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = (simulation: SavedSimulation) => {
    onLoadSimulation(simulation.simulation_data, simulation.results);
  };

  const toggleCompareSelection = (simulationId: string) => {
    const newSelection = new Set(selectedForCompare);
    if (newSelection.has(simulationId)) {
      newSelection.delete(simulationId);
    } else {
      if (newSelection.size < 4) { // Limit to 4 simulations for comparison
        newSelection.add(simulationId);
      }
    }
    setSelectedForCompare(newSelection);
  };

  const handleStartCompare = () => {
    setCompareMode(true);
    setSelectedForCompare(new Set());
  };

  const handleCancelCompare = () => {
    setCompareMode(false);
    setSelectedForCompare(new Set());
  };

  const handleCompare = () => {
    if (selectedForCompare.size >= 2 && onCompareSimulations) {
      const selectedSims = simulations.filter(sim => selectedForCompare.has(sim.id));
      onCompareSimulations(selectedSims);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'PEN' ? 'S/' : '$';
    return `${symbol}${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando historial...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1>Historial de Simulaciones</h1>
          <p className="text-muted-foreground mt-2">
            {compareMode 
              ? `Seleccione 2-4 simulaciones para comparar (${selectedForCompare.size} seleccionadas)`
              : 'Revise y gestione sus simulaciones guardadas'
            }
          </p>
        </div>
        {!compareMode && simulations.length >= 2 && (
          <Button onClick={handleStartCompare} className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Comparar Simulaciones
          </Button>
        )}
        {compareMode && (
          <div className="flex gap-2">
            <Button 
              onClick={handleCompare} 
              disabled={selectedForCompare.size < 2}
              className="flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Comparar ({selectedForCompare.size})
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancelCompare}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {simulations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3>No hay simulaciones guardadas</h3>
            <p className="text-muted-foreground text-center mt-2">
              Realice una nueva simulación y guárdela para verla en su historial
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Simulaciones Guardadas</CardTitle>
            <CardDescription>
              {simulations.length} simulación{simulations.length !== 1 ? 'es' : ''} encontrada{simulations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Precio Vivienda</TableHead>
                  <TableHead className="text-right">Cuota Mensual</TableHead>
                  <TableHead className="text-right">TCEA</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((simulation) => (
                  <TableRow key={simulation.id}>
                    <TableCell className="font-medium">
                      {simulation.name}
                    </TableCell>
                    <TableCell>
                      {formatDate(simulation.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(simulation.simulation_data.propertyPrice, simulation.simulation_data.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(simulation.results.monthlyPayment, simulation.simulation_data.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {simulation.results.tcea.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      {simulation.is_base_scenario ? (
                        <Badge variant="secondary">Base</Badge>
                      ) : (
                        <Badge variant="outline">Normal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {compareMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedForCompare.has(simulation.id)}
                              onChange={() => toggleCompareSelection(simulation.id)}
                              disabled={!selectedForCompare.has(simulation.id) && selectedForCompare.size >= 4}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-muted-foreground">Seleccionar</span>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(simulation)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Ver
                            </Button>
                            {onEditSimulation && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onEditSimulation(simulation.simulation_data)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Editar
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(simulation.id)}
                              disabled={deletingId === simulation.id}
                              className="flex items-center gap-1 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              {deletingId === simulation.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resumen estadístico */}
      {simulations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Simulaciones</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{simulations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio TCEA</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(simulations.reduce((sum, sim) => sum + sim.results.tcea, 0) / simulations.length).toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escenarios Base</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {simulations.filter(sim => sim.is_base_scenario).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}