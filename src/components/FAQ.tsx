import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { HelpCircle, Calculator, DollarSign, Percent, Target, Shield, FileText, Users, Phone } from 'lucide-react';
import { Badge } from './ui/badge';

function BBPRangesDisplay() {
  const rangosTradicional = [
    { rango: 'R1', min: '68,800', max: '98,100', bono: '27,400', color: 'bg-blue-100 border-blue-300 text-blue-900' },
    { rango: 'R2', min: '98,101', max: '146,900', bono: '22,800', color: 'bg-green-100 border-green-300 text-green-900' },
    { rango: 'R3', min: '146,901', max: '244,600', bono: '20,900', color: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    { rango: 'R4', min: '244,601', max: '362,100', bono: '7,800', color: 'bg-orange-100 border-orange-300 text-orange-900' },
    { rango: 'R5', min: '362,101', max: '488,800', bono: '0', color: 'bg-gray-100 border-gray-300 text-gray-900' },
  ];

  const rangosSostenible = [
    { rango: 'R1', min: '68,800', max: '98,100', bono: '33,700', color: 'bg-blue-100 border-blue-300 text-blue-900' },
    { rango: 'R2', min: '98,101', max: '146,900', bono: '29,100', color: 'bg-green-100 border-green-300 text-green-900' },
    { rango: 'R3', min: '146,901', max: '244,600', bono: '27,200', color: 'bg-yellow-100 border-yellow-300 text-yellow-900' },
    { rango: 'R4', min: '244,601', max: '362,100', bono: '14,100', color: 'bg-orange-100 border-orange-300 text-orange-900' },
    { rango: 'R5', min: '362,101', max: '488,800', bono: '0', color: 'bg-gray-100 border-gray-300 text-gray-900' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-foreground leading-relaxed mb-4">
        El valor del BBP varía según el rango de precio de la vivienda (R1 a R5) y el tipo de vivienda.
        Adicionalmente, si eres elegible, puedes recibir un <strong>Bono Integrado de S/3,600</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vivienda Tradicional */}
        <div>
          <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Vivienda Tradicional
          </h4>
          <div className="space-y-3">
            {rangosTradicional.map((rango) => (
              <div
                key={`trad-${rango.rango}`}
                className={`p-4 rounded-lg border-2 ${rango.color} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-bold text-sm">
                    {rango.rango}
                  </Badge>
                  <span className="font-bold text-lg">S/ {rango.bono}</span>
                </div>
                <div className="text-sm font-medium mt-2">
                  <div>Rango: S/ {rango.min} - S/ {rango.max}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vivienda Sostenible */}
        <div>
          <h4 className="font-bold text-lg mb-3 text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            Vivienda Sostenible
          </h4>
          <div className="space-y-3">
            {rangosSostenible.map((rango) => (
              <div
                key={`sost-${rango.rango}`}
                className={`p-4 rounded-lg border-2 ${rango.color} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="font-bold text-sm">
                    {rango.rango}
                  </Badge>
                  <span className="font-bold text-lg">S/ {rango.bono}</span>
                </div>
                <div className="text-sm font-medium mt-2">
                  <div>Rango: S/ {rango.min} - S/ {rango.max}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQ() {
  const faqCategories = [
    {
      id: 'general',
      title: 'General',
      icon: HelpCircle,
      questions: [
        {
          q: '¿Qué es esta plataforma?',
          a: 'Esta es una plataforma web para simular créditos hipotecarios del programa MiVivienda con cálculo automático del Bono del Buen Pagador (BBP). Permite calcular cuotas, intereses, métricas financieras y comparar diferentes escenarios de crédito.'
        },
        {
          q: '¿Necesito registrarme para usar la plataforma?',
          a: 'Sí, es necesario crear una cuenta para guardar y acceder a tus simulaciones. El registro es gratuito y solo requiere un email válido.'
        },
        {
          q: '¿Los cálculos son oficiales?',
          a: 'Los cálculos están basados en las fórmulas estándar del sistema financiero peruano y las reglas del programa MiVivienda. Sin embargo, los resultados son estimaciones y deben ser verificados con la entidad financiera antes de tomar una decisión.'
        },
        {
          q: '¿Puedo usar la plataforma en móvil?',
          a: 'Sí, la plataforma es responsive y se adapta a dispositivos móviles, tablets y computadoras.'
        }
      ]
    },
    {
      id: 'bbp',
      title: 'Bono del Buen Pagador (BBP)',
      icon: DollarSign,
      questions: [
        {
          q: '¿Qué es el Bono del Buen Pagador (BBP)?',
          a: 'El BBP es un subsidio del Estado peruano que reduce el monto a financiar en créditos hipotecarios del programa MiVivienda. El valor del bono depende del precio de la vivienda, tipo de vivienda (tradicional o sostenible) y el perfil del comprador.'
        },
        {
          q: '¿Quién puede acceder al BBP?',
          a: 'Puedes acceder al BBP si cumples alguna de estas condiciones:\n• Ingresos mensuales del hogar menores o iguales a S/4,746\n• Eres adulto mayor (60 años o más)\n• Eres persona desplazada\n• Eres migrante retornado\n• Tienes alguna discapacidad'
        },
        {
          q: '¿Cuánto es el valor del BBP?',
          a: 'El valor del BBP varía según el rango de precio de la vivienda (R1 a R5) y el tipo de vivienda.',
          customContent: true
        },
        {
          q: '¿Qué diferencia hay entre vivienda tradicional y sostenible?',
          a: 'Las viviendas sostenibles son aquellas que cumplen con criterios de eficiencia energética, uso de materiales ecológicos y diseño ambientalmente responsable. El BBP para viviendas sostenibles es mayor que para viviendas tradicionales, incentivando la construcción sostenible.'
        },
        {
          q: '¿El BBP se descuenta del precio de la vivienda?',
          a: 'Sí, el BBP se descuenta directamente del monto a financiar. Por ejemplo, si una vivienda cuesta S/150,000 y recibes un BBP de S/20,900, el monto a financiar será S/129,100 (antes de considerar la cuota inicial).'
        }
      ]
    },
    {
      id: 'uso',
      title: 'Cómo usar la plataforma',
      icon: Calculator,
      questions: [
        {
          q: '¿Cómo creo una nueva simulación?',
          a: '1. Haz clic en "Nueva Simulación" en el menú\n2. Completa los datos del cliente (edad, ingresos, ubicación, condiciones especiales)\n3. Ingresa los datos de la vivienda (precio, tipo, moneda)\n4. Configura las condiciones financieras (tasa, plazo, período de gracia)\n5. Añade seguros y costos periódicos\n6. Haz clic en "Generar Cronograma" para ver los resultados'
        },
        {
          q: '¿Puedo guardar mis simulaciones?',
          a: 'Sí, después de generar una simulación, puedes guardarla haciendo clic en "Guardar Simulación" y asignándole un nombre. Todas tus simulaciones guardadas estarán disponibles en la sección "Historial".'
        },
        {
          q: '¿Cómo comparo diferentes escenarios?',
          a: 'Tienes dos opciones:\n\n1. Comparación rápida: Desde los resultados, haz clic en "Comparar Escenarios" para clonar el escenario actual y modificarlo.\n\n2. Comparación múltiple: Ve a "Historial", selecciona 2 o más simulaciones guardadas y haz clic en "Comparar Seleccionadas" para ver una comparación lado a lado.'
        },
        {
          q: '¿Puedo editar una simulación guardada?',
          a: 'Sí, desde el "Historial" puedes hacer clic en "Editar" sobre cualquier simulación guardada. Esto cargará los datos en el formulario de nueva simulación para que puedas modificarlos.'
        },
        {
          q: '¿Qué información muestra el resumen en tiempo real?',
          a: 'Mientras completas el formulario, verás en el panel derecho un resumen que se actualiza automáticamente mostrando:\n• BBP estimado\n• Monto a financiar (después del BBP)\n• TEM (Tasa Efectiva Mensual) calculada'
        }
      ]
    },
    {
      id: 'metricas',
      title: 'Métricas Financieras',
      icon: Percent,
      questions: [
        {
          q: '¿Qué es la TCEA?',
          a: 'La TCEA (Tasa de Costo Efectivo Anual) es la tasa que incluye todos los costos del crédito: intereses, seguros, comisiones y gastos. Representa el costo real anual del préstamo y permite comparar diferentes ofertas de crédito.'
        },
        {
          q: '¿Qué es la TREA?',
          a: 'La TREA (Tasa de Rendimiento Efectivo Anual) es la tasa de rendimiento que obtiene la entidad financiera. Es aproximadamente el 90% de la TCEA y representa la rentabilidad del banco.'
        },
        {
          q: '¿Qué es el VAN?',
          a: 'El VAN (Valor Actual Neto) mide la rentabilidad del crédito desde la perspectiva del cliente. Un VAN negativo indica que el crédito tiene un costo neto para el cliente. Se calcula usando una tasa de descuento (Cok - Costo de Oportunidad del Capital) que puedes configurar en el formulario.'
        },
        {
          q: '¿Qué es la TIR?',
          a: 'La TIR (Tasa Interna de Retorno) es la tasa de interés que iguala el valor presente de los pagos con el monto recibido. Representa la tasa efectiva del crédito considerando todos los flujos de caja.'
        },
        {
          q: '¿Qué significa una cuota mensual?',
          a: 'La cuota mensual mostrada es la cuota base (capital + intereses) sin incluir seguros y cargos periódicos. El cronograma detallado muestra el pago total mensual que incluye todos los costos.'
        }
      ]
    },
    {
      id: 'tasas',
      title: 'Tipos de Tasa de Interés',
      icon: Target,
      questions: [
        {
          q: '¿Qué tipos de tasa puedo ingresar?',
          a: 'Puedes ingresar la tasa en diferentes formatos:\n\n• TEA (Tasa Efectiva Anual): Tasa anual compuesta\n• TES (Tasa Efectiva Semestral): Tasa semestral\n• TET (Tasa Efectiva Trimestral): Tasa trimestral\n• TEM (Tasa Efectiva Mensual): Tasa mensual\n• TNA (Tasa Nominal Anual): Requiere especificar el período de capitalización'
        },
        {
          q: '¿Cómo se convierte la tasa a mensual?',
          a: 'La plataforma convierte automáticamente cualquier tasa a TEM (Tasa Efectiva Mensual) usando las fórmulas estándar:\n\n• TEA → TEM: (1 + TEA)^(1/12) - 1\n• TES → TEM: (1 + TES)^(1/6) - 1\n• TET → TEM: (1 + TET)^(1/3) - 1\n• TNA: Se divide por el número de capitalizaciones al año y luego se convierte a mensual'
        },
        {
          q: '¿Qué es el período de capitalización en TNA?',
          a: 'El período de capitalización indica con qué frecuencia se capitalizan los intereses en una TNA. Puede ser:\n• Anual: 1 vez al año\n• Trimestral: 4 veces al año\n• Mensual: 12 veces al año\n• Semanal: 52 veces al año'
        }
      ]
    },
    {
      id: 'gracia',
      title: 'Período de Gracia',
      icon: FileText,
      questions: [
        {
          q: '¿Qué es un período de gracia?',
          a: 'El período de gracia es un tiempo durante el cual no se requiere pagar la amortización del capital, reduciendo temporalmente la cuota mensual.'
        },
        {
          q: '¿Qué tipos de período de gracia hay?',
          a: 'Hay dos tipos:\n\n• Gracia Parcial: Pagas solo los intereses y los seguros/cargos. El capital no se amortiza pero tampoco se capitaliza.\n\n• Gracia Total: No pagas intereses ni amortización. Los intereses se capitalizan (se suman al saldo), solo pagas seguros y cargos administrativos.'
        },
        {
          q: '¿Cuánto tiempo puede durar el período de gracia?',
          a: 'Puedes configurar hasta 60 meses de período de gracia. Sin embargo, el tiempo real dependerá de las políticas de la entidad financiera.'
        }
      ]
    },
    {
      id: 'costos',
      title: 'Costos y Seguros',
      icon: Shield,
      questions: [
        {
          q: '¿Qué costos iniciales puedo incluir?',
          a: 'Puedes incluir:\n• Costes Notariales\n• Costes Registrales\n• Tasación\n• Comisión de Estudio\n• Comisión de Activación\n\nEstos costos se suman al monto del préstamo.'
        },
        {
          q: '¿Qué son los seguros periódicos?',
          a: 'Los seguros que se cobran en cada cuota son:\n\n• Seguro de Desgravamen: Protege en caso de fallecimiento o invalidez. Se calcula sobre el saldo del préstamo. Generalmente se cobra solo en los primeros 4 períodos.\n\n• Seguro contra Todo Riesgo: Protege la vivienda. Se calcula sobre el valor de la propiedad.'
        },
        {
          q: '¿Qué son los cargos periódicos?',
          a: 'Son costos fijos que se cobran en cada período:\n• Portes: Costo de envío de estados de cuenta\n• Gastos de Administración: Costos administrativos del banco\n• Comisión Periódica: Cualquier comisión recurrente'
        },
        {
          q: '¿Con qué frecuencia se aplican los costos periódicos?',
          a: 'Puedes configurar la frecuencia:\n• Mensual (12 veces al año)\n• Quincenal (24 veces al año)\n• Semanal (52 veces al año)'
        },
        {
          q: '¿Los costos periódicos afectan la TCEA?',
          a: 'Los portes y gastos administrativos generalmente no se incluyen en el cálculo de la TCEA según la normativa peruana. Sin embargo, los seguros sí se incluyen.'
        }
      ]
    },
    {
      id: 'tecnico',
      title: 'Aspectos Técnicos',
      icon: Users,
      questions: [
        {
          q: '¿Se guardan mis datos personales?',
          a: 'Solo se guardan los datos necesarios para calcular el BBP y las simulaciones. Tus datos están protegidos y solo tú puedes acceder a tus simulaciones guardadas mediante tu cuenta.'
        },
        {
          q: '¿Cómo se calcula el tipo de cambio para viviendas en USD?',
          a: 'La plataforma obtiene automáticamente el tipo de cambio oficial de la SBS (Superintendencia de Banca, Seguros y AFP) desde la API de Dólar.pe para convertir los valores del BBP cuando trabajas con dólares.'
        },
        {
          q: '¿Los cálculos son exactos?',
          a: 'Los cálculos siguen las fórmulas estándar del sistema financiero peruano. Sin embargo, pueden existir pequeñas diferencias con los cálculos de las entidades financieras debido a redondeos o políticas específicas. Siempre verifica con tu banco antes de tomar una decisión.'
        },
        {
          q: '¿Puedo exportar los resultados?',
          a: 'Actualmente puedes ver y copiar los resultados desde la plataforma. La funcionalidad de exportación a Excel o PDF está en desarrollo.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Preguntas Frecuentes (FAQ)</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas a las preguntas más comunes sobre la plataforma y el programa MiVivienda
        </p>
      </div>

      <div className="space-y-6">
        {faqCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {category.questions.map((item, index) => (
                    <AccordionItem key={index} value={`${category.id}-${index}`}>
                      <AccordionTrigger className="text-left font-semibold text-foreground">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground whitespace-pre-line">
                        {item.customContent && item.q === '¿Cuánto es el valor del BBP?' ? (
                          <BBPRangesDisplay />
                        ) : (
                          <p className="text-foreground leading-relaxed">{item.a}</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            ¿No encuentras tu respuesta?
          </CardTitle>
          <CardDescription className="text-foreground">
            Si tienes más preguntas o necesitas ayuda adicional, puedes contactarnos:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <a href="tel:+51987654321" className="text-lg font-semibold text-primary hover:underline">
              +51 987 654 321
            </a>
            <Badge variant="outline" className="ml-2">Lun - Vie: 9:00 AM - 6:00 PM</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            También puedes contactar a tu entidad financiera o consultar la información oficial del programa MiVivienda.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

