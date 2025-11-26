import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Calculator } from 'lucide-react';
import { SimulationData, CalculationResults } from '../App';
import { calculateFinancialMetrics, calculateBBP } from './FinancialCalculations';
import { Checkbox } from './ui/checkbox';

interface NewSimulationProps {
  onSubmit: (data: SimulationData, results: CalculationResults) => void;
}

export function NewSimulation({ onSubmit }: NewSimulationProps) {
  const [formData, setFormData] = useState<SimulationData>({
    propertyPrice: 100000,
    downPayment: 5000,
    downPaymentType: 'amount',
    currency: 'PEN',
    rateType: 'TEA',
    rate: 9.5,
    term: 20,
    termType: 'years',
    gracePeriodType: 'none',
    gracePeriodMonths: 0,
    insuranceAndFees: 2500,
    seguroDesgravamenRate: 0.5, 
    seguroRiesgoRate: 0.2, 
    portesPerPeriod: 20,
    adminFeesPerPeriod: 40,
    periodicCommissionPerPeriod: 0,
    periodicCostFrequencyPerYear: 12,
    periodicRatesArePerPeriod: false,
    // Valores iniciales razonables para el perfil del cliente
    ingresos: 3000,
    edad: 30,
    tipoVivienda: 'Tradicional',
    zona: 'urbana',
    numeroIntegrantesHogar: 3,
    numeroMenores: 0,
    nivelIngresoDeclarado: 'medio',
    adultoMayor: false,
    personaDesplazada: false,
    migrantesRetornados: false,
    personaConDiscapacidad: false,
    // Oferta inmobiliaria seleccionada (solo informativa)
    ofertaInmobiliaria: 'departamento',
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

      // Calcular BBP usando la misma lógica central que en los cálculos finales
      const bbp = await calculateBBP(formData.propertyPrice, formData.currency, formData);
      const financedAmount = financedAmountBeforeBBP - bbp;

        let monthlyRate: number;
        const rateDecimal = formData.rate / 100;
        
        if (formData.rateType === 'TEA') {
          // TEA → TEM: (1 + TEA)^(1/12) - 1
          monthlyRate = Math.pow(1 + rateDecimal, 1 / 12) - 1;
        } else if (formData.rateType === 'TES') {
          // TES → TEM: (1 + TES)^(1/6) - 1
          monthlyRate = Math.pow(1 + rateDecimal, 1 / 6) - 1;
        } else if (formData.rateType === 'TET') {
          // TET → TEM: (1 + TET)^(1/3) - 1
          monthlyRate = Math.pow(1 + rateDecimal, 1 / 3) - 1;
        } else if (formData.rateType === 'TEM') {
          // TEM ya está en mensual
          monthlyRate = rateDecimal;
        } else if (formData.rateType === 'TNA') {
          // TNA requiere período de capitalización
          const capitalizationsPerYear = 
            formData.capitalizationPeriod === 'anual' ? 1 :
            formData.capitalizationPeriod === 'semanal' ? 52 :
            formData.capitalizationPeriod === 'trimestral' ? 4 : 12;
          const periodicRate = rateDecimal / capitalizationsPerYear;
          const periodsPerMonth = capitalizationsPerYear / 12;
          monthlyRate = Math.pow(1 + periodicRate, periodsPerMonth) - 1;
        } else {
          monthlyRate = 0;
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
            {/* Datos del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                        updateFormData({ edad: value });
                      }}
                      min={18}
                      max={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ingresos">Ingresos mensuales del hogar</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.currency === 'PEN' ? 'S/' : '$'}
                      </span>
                      <Input
                        id="ingresos"
                        type="number"
                        className="pl-8"
                        value={formData.ingresos ?? ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : Number(e.target.value);
                          updateFormData({ ingresos: value });
                        }}
                        min={0}
                        step={100}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      type="text"
                      value={formData.departamento ?? ''}
                      onChange={(e) => updateFormData({ departamento: e.target.value || undefined })}
                      placeholder="Ej: Lima"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Input
                      id="provincia"
                      type="text"
                      value={formData.provincia ?? ''}
                      onChange={(e) => updateFormData({ provincia: e.target.value || undefined })}
                      placeholder="Ej: Lima"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="distrito">Distrito</Label>
                    <Input
                      id="distrito"
                      type="text"
                      value={formData.distrito ?? ''}
                      onChange={(e) => updateFormData({ distrito: e.target.value || undefined })}
                      placeholder="Ej: Comas"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona</Label>
                    <Select
                      value={formData.zona ?? 'urbana'}
                      onValueChange={(value: 'urbana' | 'rural') => updateFormData({ zona: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urbana">Urbana</SelectItem>
                        <SelectItem value="rural">Rural</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condición especial</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          id="adultoMayor"
                          checked={!!formData.adultoMayor}
                          onCheckedChange={(checked) =>
                            updateFormData({ adultoMayor: checked === true })
                          }
                        />
                        <span className="text-sm">Adulto mayor</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          id="personaDesplazada"
                          checked={!!formData.personaDesplazada}
                          onCheckedChange={(checked) =>
                            updateFormData({ personaDesplazada: checked === true })
                          }
                        />
                        <span className="text-sm">Persona desplazada</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          id="migrantesRetornados"
                          checked={!!formData.migrantesRetornados}
                          onCheckedChange={(checked) =>
                            updateFormData({ migrantesRetornados: checked === true })
                          }
                        />
                        <span className="text-sm">Migrante retornado</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox
                          id="personaConDiscapacidad"
                          checked={!!formData.personaConDiscapacidad}
                          onCheckedChange={(checked) =>
                            updateFormData({ personaConDiscapacidad: checked === true })
                          }
                        />
                        <span className="text-sm">Persona con discapacidad</span>
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numeroIntegrantesHogar">Número de integrantes del hogar</Label>
                    <Input
                      id="numeroIntegrantesHogar"
                      type="number"
                      value={formData.numeroIntegrantesHogar ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                        updateFormData({ numeroIntegrantesHogar: value });
                      }}
                      min={1}
                      max={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroMenores">Número de menores de 18 años</Label>
                    <Input
                      id="numeroMenores"
                      type="number"
                      value={formData.numeroMenores ?? ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : Number(e.target.value);
                        updateFormData({ numeroMenores: value });
                      }}
                      min={0}
                      max={10}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ocupacionPrincipal">Ocupación principal</Label>
                    <Input
                      id="ocupacionPrincipal"
                      type="text"
                      value={formData.ocupacionPrincipal ?? ''}
                      onChange={(e) => updateFormData({ ocupacionPrincipal: e.target.value || undefined })}
                      placeholder="Ej: Empleado, independiente"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nivelEducativo">Nivel educativo</Label>
                    <Input
                      id="nivelEducativo"
                      type="text"
                      value={formData.nivelEducativo ?? ''}
                      onChange={(e) => updateFormData({ nivelEducativo: e.target.value || undefined })}
                      placeholder="Ej: Superior, técnico"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nivelIngresoDeclarado">Nivel de ingreso declarado</Label>
                    <Select
                      value={formData.nivelIngresoDeclarado ?? 'medio'}
                      onValueChange={(value: 'bajo' | 'medio' | 'alto') =>
                        updateFormData({ nivelIngresoDeclarado: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos de la Vivienda */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="ofertaInmobiliaria">Producto / oferta inmobiliaria</Label>
                    <Select
                      value={formData.ofertaInmobiliaria || 'departamento'}
                      onValueChange={(value: 'departamento' | 'casa' | 'terreno' | 'oficina' | 'local_comercial' | 'otro') =>
                        updateFormData({ ofertaInmobiliaria: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de inmueble" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="departamento">Departamento</SelectItem>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="local_comercial">Local comercial</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      onValueChange={(value: 'TEA' | 'TES' | 'TET' | 'TEM' | 'TNA') => updateFormData({ rateType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEA">TEA (Tasa Efectiva Anual)</SelectItem>
                        <SelectItem value="TES">TES (Tasa Efectiva Semestral)</SelectItem>
                        <SelectItem value="TET">TET (Tasa Efectiva Trimestral)</SelectItem>
                        <SelectItem value="TEM">TEM (Tasa Efectiva Mensual)</SelectItem>
                        <SelectItem value="TNA">TNA (Tasa Nominal Anual)</SelectItem>
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
                    <Label htmlFor="capitalizationPeriod">Período de capitalización</Label>
                    <Select
                      value={formData.capitalizationPeriod || 'mensual'}
                      onValueChange={(value: 'anual' | 'semanal' | 'trimestral' | 'mensual') => 
                        updateFormData({ capitalizationPeriod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
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
            {/* Costos */}
            <Card>
              <CardHeader>
                <CardTitle>Seguros y Cargos Periódicos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seguroDesgravamenRate">% Seguro Desgravamen (anual)</Label>
                    <Input
                      id="seguroDesgravamenRate"
                      type="number"
                      value={formData.seguroDesgravamenRate}
                      onChange={(e) => updateFormData({ seguroDesgravamenRate: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">Se aplican por período según la frecuencia seleccionada.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seguroRiesgoRate">% Seguro Riesgo (anual)</Label>
                    <Input
                      id="seguroRiesgoRate"
                      type="number"
                      value={formData.seguroRiesgoRate}
                      onChange={(e) => updateFormData({ seguroRiesgoRate: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground">Se aplican por período según la frecuencia seleccionada.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodicCostFrequencyPerYear">Frecuencia de aplicación de costos periódicos</Label>
                  <Select
                    value={String(formData.periodicCostFrequencyPerYear || 12)}
                    onValueChange={(value: string) => updateFormData({ periodicCostFrequencyPerYear: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Mensual (12)</SelectItem>
                      <SelectItem value="24">Quincenal (24)</SelectItem>
                      <SelectItem value="52">Semanal (52)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portesPerPeriod">Portes por periodo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.currency === 'PEN' ? 'S/' : '$'}
                      </span>
                      <Input
                        id="portesPerPeriod"
                        type="number"
                        className="pl-8"
                        value={formData.portesPerPeriod}
                        onChange={(e) => updateFormData({ portesPerPeriod: Number(e.target.value) })}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminFeesPerPeriod">Gastos Administración por periodo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.currency === 'PEN' ? 'S/' : '$'}
                      </span>
                      <Input
                        id="adminFeesPerPeriod"
                        type="number"
                        className="pl-8"
                        value={formData.adminFeesPerPeriod}
                        onChange={(e) => updateFormData({ adminFeesPerPeriod: Number(e.target.value) })}
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodicCommissionPerPeriod">Comisión periódica</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                        {formData.currency === 'PEN' ? 'S/' : '$'}
                      </span>
                      <Input
                        id="periodicCommissionPerPeriod"
                        type="number"
                        className="pl-8"
                        value={formData.periodicCommissionPerPeriod}
                        onChange={(e) => updateFormData({ periodicCommissionPerPeriod: Number(e.target.value) })}
                        min="0"
                        step="1"
                      />
                    </div>
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