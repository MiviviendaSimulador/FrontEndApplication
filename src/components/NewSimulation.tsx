import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Calculator } from 'lucide-react';
import { SimulationData, CalculationResults } from '../App';
import { calculateFinancialMetrics } from './FinancialCalculations';
import {BBPCalc, TipoDeVivienda} from "../domain/BBPCalc";

interface NewSimulationProps {
  onSubmit: (data: SimulationData, results: CalculationResults) => void;
}

export function NewSimulation({ onSubmit }: NewSimulationProps) {
  const [formData, setFormData] = useState<SimulationData>({
    propertyPrice: 250000,
    downPayment: 50000,
    downPaymentType: 'amount',
    currency: 'PEN',
    rateType: 'TEA',
    rate: 9.5,
    term: 20,
    termType: 'years',
    gracePeriodType: 'none',
    gracePeriodMonths: 0,
    insuranceAndFees: 2500
  });

  const [previewMetrics, setPreviewMetrics] = useState<{
    bbp: number;
    financedAmount: number;
    monthlyRate: number;
  } | null>(null);

  useEffect(() => {
    const calcularPreview = async () => {
      const downPaymentAmount = formData.downPaymentType === 'percentage' 
        ? (formData.propertyPrice * formData.downPayment / 100)
        : formData.downPayment;
      
      const financedAmountBeforeBBP = formData.propertyPrice - downPaymentAmount;
      /*
      const maxBBP = formData.currency === 'PEN' ? 25500 : 7000;
      const bbp = Math.min(financedAmountBeforeBBP * 0.05, maxBBP);
      const financedAmount = financedAmountBeforeBBP - bbp;*/
        // Usar BBPCalc para calcular el BBP correcto
        const tipoVivienda = (formData.tipoVivienda === 'Sostenible')
            ? TipoDeVivienda.Sostenible
            : TipoDeVivienda.Tradicional;  // Por defecto Tradicional

        const ingresos = formData.ingresos || 5000;  // Valor fuera del rango del integrador (<= 4746)
        const adultoMayor = formData.adultoMayor || false;
        const personaDesplazada = formData.personaDesplazada || false;
        const migrantesRetornados = formData.migrantesRetornados || false;
        const personaConDiscapacidad = formData.personaConDiscapacidad || false;

        const bbpCalc = await BBPCalc.crear(
            formData.propertyPrice,  // Usar propertyPrice, no financedAmountBeforeBBP
            tipoVivienda,
            ingresos,
            adultoMayor,
            personaDesplazada,
            migrantesRetornados,
            personaConDiscapacidad,
            formData.currency
        );

        const bbp = bbpCalc.CalculoDeBono();
        const financedAmount = financedAmountBeforeBBP - bbp;

        let monthlyRate: number;
        if (formData.rateType === 'TEA') {
          monthlyRate = Math.pow(1 + formData.rate / 100, 1 / 12) - 1;
        } else {
          const periodicRate = formData.rate / 100 / (formData.capitalizationsPerYear || 12);
          const periodsPerMonth = (formData.capitalizationsPerYear || 12) / 12;
          monthlyRate = Math.pow(1 + periodicRate, periodsPerMonth) - 1;
        }

        setPreviewMetrics({
          bbp,
          financedAmount,
          monthlyRate: monthlyRate * 100
        });
    };
    
    calcularPreview();
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await calculateFinancialMetrics(formData);
    onSubmit(formData, results);
  };

  const updateFormData = (updates: Partial<SimulationData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1>Nueva Simulación</h1>
            <p className="text-muted-foreground mt-2">
              Complete los datos para simular su crédito MiVivienda con Bono Buen Pagador
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Vivienda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyPrice">Precio de la vivienda</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.currency === 'PEN' ? 'S/' : '$'}
                      </span>
                      <Input
                        id="propertyPrice"
                        type="number"
                        className="pl-8"
                        value={formData.propertyPrice}
                        onChange={(e) => updateFormData({ propertyPrice: Number(e.target.value) })}
                        min="0"
                        step="1000"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: 'PEN' | 'USD') => updateFormData({ currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN">Soles (PEN)</SelectItem>
                        <SelectItem value="USD">Dólares (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  <div className="space-y-2">
                      <Label htmlFor="tipoVivienda">Tipo de vivienda</Label>
                      <Select
                          value={formData.tipoVivienda || 'Tradicional'}
                          onValueChange={(value: 'Tradicional' | 'Sostenible') => updateFormData({ tipoVivienda: value })}
                      >
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Tradicional">Tradicional</SelectItem>
                              <SelectItem value="Sostenible">Sostenible</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="downPayment">Cuota inicial</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.downPaymentType === 'amount' 
                          ? (formData.currency === 'PEN' ? 'S/' : '$')
                          : '%'
                        }
                      </span>
                      <Input
                        id="downPayment"
                        type="number"
                        className="pl-8"
                        value={formData.downPayment}
                        onChange={(e) => updateFormData({ downPayment: Number(e.target.value) })}
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downPaymentType">Tipo</Label>
                    <Select
                      value={formData.downPaymentType}
                      onValueChange={(value: 'amount' | 'percentage') => updateFormData({ downPaymentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Monto</SelectItem>
                        <SelectItem value="percentage">Porcentaje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Financieras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rateType">Tipo de tasa</Label>
                    <Select
                      value={formData.rateType}
                      onValueChange={(value: 'TEA' | 'TNA') => updateFormData({ rateType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEA">TEA</SelectItem>
                        <SelectItem value="TNA">TNA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Valor de la tasa (%)</Label>
                    <Input
                      id="rate"
                      type="number"
                      value={formData.rate}
                      onChange={(e) => updateFormData({ rate: Number(e.target.value) })}
                      min="0"
                      max="50"
                      step="0.1"
                      required
                    />
                  </div>
                </div>

                {formData.rateType === 'TNA' && (
                  <div className="space-y-2">
                    <Label htmlFor="capitalizationsPerYear">Capitalizaciones por año (m)</Label>
                    <Input
                      id="capitalizationsPerYear"
                      type="number"
                      value={formData.capitalizationsPerYear || 12}
                      onChange={(e) => updateFormData({ capitalizationsPerYear: Number(e.target.value) })}
                      min="1"
                      max="365"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Plazo</Label>
                    <Input
                      id="term"
                      type="number"
                      value={formData.term}
                      onChange={(e) => updateFormData({ term: Number(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termType">Unidad</Label>
                    <Select
                      value={formData.termType}
                      onValueChange={(value: 'years' | 'months') => updateFormData({ termType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="years">Años</SelectItem>
                        <SelectItem value="months">Meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Período de Gracia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriodType">Tipo de período de gracia</Label>
                    <Select
                      value={formData.gracePeriodType}
                      onValueChange={(value: 'none' | 'partial' | 'total') => updateFormData({ gracePeriodType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                        <SelectItem value="total">Total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.gracePeriodType !== 'none' && (
                    <div className="space-y-2">
                      <Label htmlFor="gracePeriodMonths">Meses de gracia</Label>
                      <Input
                        id="gracePeriodMonths"
                        type="number"
                        value={formData.gracePeriodMonths}
                        onChange={(e) => updateFormData({ gracePeriodMonths: Number(e.target.value) })}
                        min="0"
                        max="60"
                        required
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Seguros y Cargos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="insuranceAndFees">Monto total de seguros y cargos</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                      {formData.currency === 'PEN' ? 'S/' : '$'}
                    </span>
                    <Input
                      id="insuranceAndFees"
                      type="number"
                      className="pl-8"
                      value={formData.insuranceAndFees}
                      onChange={(e) => updateFormData({ insuranceAndFees: Number(e.target.value) })}
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Generar Cronograma
            </Button>
          </form>
        </div>

        {}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle>Resumen en Tiempo Real</CardTitle>
                <CardDescription>
                  Métricas calculadas automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewMetrics && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">BBP estimado:</span>
                        <span className="font-medium">
                          {formData.currency === 'PEN' ? 'S/' : '$'}{previewMetrics.bbp.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monto a financiar:</span>
                        <span className="font-medium">
                          {formData.currency === 'PEN' ? 'S/' : '$'}{previewMetrics.financedAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TEM:</span>
                        <span className="font-medium">
                          {previewMetrics.monthlyRate.toFixed(4)}%
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}