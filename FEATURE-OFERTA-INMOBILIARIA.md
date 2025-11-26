# Feature: Campo Oferta Inmobiliaria

## Resumen
Se ha agregado un campo de selección para el tipo de producto u oferta inmobiliaria en el formulario de simulación. Este campo es **puramente informativo** y **NO afecta ningún cálculo financiero**.

## Implementación

### 1. Tipo de Dato (App.tsx)
- **Ubicación**: `src/App.tsx`, línea 44
- **Campo**: `ofertaInmobiliaria?: 'departamento' | 'casa' | 'terreno' | 'oficina' | 'local_comercial' | 'otro'`
- **Tipo**: Opcional (puede ser undefined)

### 2. Formulario de Entrada (NewSimulation.tsx)
- **Ubicación**: `src/components/NewSimulation.tsx`, líneas 411-431
- **Componente**: Select dropdown dentro de la sección "Datos de la Vivienda"
- **Opciones disponibles**:
  - Departamento (valor por defecto)
  - Casa
  - Terreno
  - Oficina
  - Local comercial
  - Otro

### 3. Visualización de Resultados (Results.tsx)
- **Ubicación**: `src/components/Results.tsx`, líneas 276-290
- **Sección**: "Resumen del Préstamo"
- **Presentación**: Muestra el texto descriptivo del tipo seleccionado en el resumen junto con:
  - Tipo de vivienda
  - Ubicación declarada

## Verificación de No Afectación en Cálculos

✅ **Confirmado**: El campo `ofertaInmobiliaria` NO aparece en el archivo de cálculos financieros:
- Archivo revisado: `src/components/FinancialCalculations.ts`
- Resultado: El campo no es utilizado en ninguna fórmula o lógica de cálculo

## Uso del Campo

El campo `ofertaInmobiliaria` es útil para:
- Registro de información adicional del cliente
- Segmentación de simulaciones guardadas
- Filtros y reportes futuros
- Contexto adicional en el historial de simulaciones

## Compatibilidad

- El campo es opcional, por lo que simulaciones antiguas sin este dato seguirán funcionando correctamente
- El valor por defecto es 'departamento'
- Si no se especifica, se muestra "No especificado" en los resultados

## Archivos Modificados

1. `src/App.tsx` - Definición del tipo SimulationData
2. `src/components/NewSimulation.tsx` - Formulario con dropdown selector
3. `src/components/Results.tsx` - Visualización en resumen de resultados

## Testing Recomendado

- [ ] Verificar que el dropdown funciona correctamente
- [ ] Confirmar que el valor seleccionado se muestra en los resultados
- [ ] Validar que los cálculos financieros dan el mismo resultado independientemente del valor seleccionado
- [ ] Probar que las simulaciones se guardan correctamente con este campo
- [ ] Verificar que las simulaciones antiguas sin este campo se cargan sin errores
