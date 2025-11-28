export enum RangosDeVivienda {
    R1,
    R2,
    R3,
    R4,
    R5
}

export enum TipoDeVivienda {
    Tradicional,
    Sostenible
}

interface TipoCambioResponseDolarPe {
    range: {
        from: string;
        to: string;
        max_days: number;
    };
    series: {
        'USD-PEN': {
            labels: string[];
            data: number[];
        };
    };
}

export class currencySwitch {
    private static readonly API_BASE_URL = 'https://dolar.pe/api/public/series';
    
    /**
     * Obtiene la tasa de cambio promedio de SBS desde la API de Dólar.pe
     * @returns Promise<number> - Tasa de cambio promedio
     */
    public static async obtenerTasaDeCambioSBS(): Promise<number> {
        try {
            const url = `${this.API_BASE_URL}?pair=USD-PEN`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener tasa de cambio: ${response.status} ${response.statusText}`);
            }

            const data: TipoCambioResponseDolarPe = await response.json();
            
            // Obtener el último valor de la serie (más reciente)
            const serie = data.series['USD-PEN'];
            if (!serie || !serie.data || serie.data.length === 0) {
                throw new Error('No se encontraron datos en la respuesta');
            }
            
            const tasaCambio = serie.data[serie.data.length - 1];
            const fecha = serie.labels[serie.labels.length - 1];
            
            console.log('[currencySwitch] Tasa de cambio obtenida desde Dólar.pe:', {
                tasa: tasaCambio,
                fecha: fecha
            });
            
            return tasaCambio;
            
        } catch (error) {
            console.error('[currencySwitch] Error al obtener tasa de cambio:', error);
            throw new Error('No se pudo obtener la tasa de cambio de SBS');
        }
    }
    
    /**
     * Obtiene la tasa de cambio de compra (para convertir PEN a USD)
     * Usa el mismo valor que devuelve Dólar.pe (tipo de cambio oficial SBS)
     * @returns Promise<number> - Tasa de cambio de compra
     */
    public static async obtenerTasaCompra(): Promise<number> {
        return await this.obtenerTasaDeCambioSBS();
    }
    
    /**
     * Obtiene la tasa de cambio de venta (para convertir USD a PEN)
     * Usa el mismo valor que devuelve Dólar.pe (tipo de cambio oficial SBS)
     * @returns Promise<number> - Tasa de cambio de venta
     */
    public static async obtenerTasaVenta(): Promise<number> {
        return await this.obtenerTasaDeCambioSBS();
    }
    
    /**
     * Convierte PEN (Soles) a USD (Dólares)
     * @param montoPEN - Monto en soles peruanos
     * @returns Promise<number> - Monto convertido a dólares
     */
    public static async PENtoUSD(montoPEN: number): Promise<number> {
        const tasaCompra = await this.obtenerTasaCompra();
        return montoPEN / tasaCompra;
    }
    
    /**
     * Convierte USD (Dólares) a PEN (Soles)
     * @param montoUSD - Monto en dólares
     * @returns Promise<number> - Monto convertido a soles
     */
    public static async USDtoPEN(montoUSD: number): Promise<number> {
        const tasaVenta = await this.obtenerTasaVenta();
        return montoUSD * tasaVenta;
    }
}

export class BBPCalc {
    private valorVivienda: number;
    private tipoDeVivienda: TipoDeVivienda;
    private ingresos: number;
    private adultoMayor: boolean;
    private personaDesplazada: boolean;
    private migrantesRetornados: boolean;
    private personaConDiscapacidad: boolean;
    private currency: string;
    private tasaCompra: number;

    private calcularRango(): RangosDeVivienda {
        let rangos = [
            { min: 68800, max: 98100, rango: RangosDeVivienda.R1 },
            { min: 98101, max: 146900, rango: RangosDeVivienda.R2 },
            { min: 146901, max: 244600, rango: RangosDeVivienda.R3 },
            { min: 244601, max: 362100, rango: RangosDeVivienda.R4 },
            { min: 362101, max: 488800, rango: RangosDeVivienda.R5 }
        ];
        if (this.currency === 'USD'){
            rangos.forEach(rango => {
                rango.min = rango.min / this.tasaCompra;
                rango.max = rango.max / this.tasaCompra;
            });
        }
        console.log('[BBPCalc] Rangos de vivienda:', rangos);
        console.log('[BBPCalc] Valor de vivienda:', this.valorVivienda);
        const rangoEncontrado = rangos.find(r => this.valorVivienda >= r.min && this.valorVivienda <= r.max);
        if (!rangoEncontrado) {
            console.warn('[BBPCalc] ⚠️ Valor fuera de rango, usando R5 por defecto');
            return RangosDeVivienda.R5;
        }
        console.log('[BBPCalc] ✅ Rango encontrado:', {
            rango: `R${rangoEncontrado.rango + 1}`,
            min: rangoEncontrado.min,
            max: rangoEncontrado.max,
            valorVivienda: this.valorVivienda
        });
        if (rangoEncontrado) {
            return rangoEncontrado.rango;
        } else {
            return RangosDeVivienda.R5;
        }
    }
    private rango: RangosDeVivienda;

    private valorDelBono(tipoDeVivienda: TipoDeVivienda): number{
        const valoresBBP = {
            tradicional: {
                [RangosDeVivienda.R1]: 27400,
                [RangosDeVivienda.R2]: 22800,
                [RangosDeVivienda.R3]: 20900,
                [RangosDeVivienda.R4]: 7800,
                [RangosDeVivienda.R5]: 0
            },
            sostenible: {
                [RangosDeVivienda.R1]: 33700,
                [RangosDeVivienda.R2]: 29100,
                [RangosDeVivienda.R3]: 27200,
                [RangosDeVivienda.R4]: 14100,
                [RangosDeVivienda.R5]: 0
            }
        };

        const tipo = tipoDeVivienda === TipoDeVivienda.Tradicional ? 'tradicional' : 'sostenible';
        if (this.currency === 'USD'){
            return valoresBBP[tipo][this.rango] / this.tasaCompra;
        }
        return valoresBBP[tipo][this.rango];
    }
    private _valorDelBono: number;

    private calcularBonoIntegrado(): number {
        const BONO_INTEGRADO_PEN = 3600;
        if (this.currency === 'USD') {
            return BONO_INTEGRADO_PEN / this.tasaCompra;
        }
        return BONO_INTEGRADO_PEN;
    }
    private _bonoIntegrado: number;

    /**
     * Verifica si el usuario es elegible para el Bono Buen Pagador (BBP)
     * Regla: Solo aplica si ingresos <= S/4,746 O si tiene alguna condición especial
     */
    private esElegibleParaBBP(): boolean {
        return this.ingresos <= 4746 || this.adultoMayor || this.personaDesplazada || this.migrantesRetornados || this.personaConDiscapacidad;
    }

    /**
     * Verifica si aplica el bono integrado adicional (misma condición que elegibilidad BBP)
     */
    private aplicaIntegrado(): boolean{
        return this.esElegibleParaBBP();
    }

    /**
     * Constructor privado - solo se usa internamente desde el factory method
     */
    private constructor(
        valorVivienda: number, 
        tipoDeVivienda: TipoDeVivienda, 
        ingresos: number, 
        adultoMayor: boolean, 
        personaDesplazada: boolean, 
        migrantesRetornados: boolean, 
        personaConDiscapacidad: boolean, 
        currency: string,
        tasaCompra: number
    ) {
        this.valorVivienda = valorVivienda;
        this.tipoDeVivienda = tipoDeVivienda;
        this.ingresos = ingresos;
        this.adultoMayor = adultoMayor;
        this.personaDesplazada = personaDesplazada;
        this.migrantesRetornados = migrantesRetornados;
        this.personaConDiscapacidad = personaConDiscapacidad;
        this.currency = currency;
        this.tasaCompra = tasaCompra;

        this.rango = this.calcularRango();
        this._valorDelBono = this.valorDelBono(this.tipoDeVivienda);
        this._bonoIntegrado = this.calcularBonoIntegrado();

        console.log('[BBPCalc] Inicializando cálculo de BBP:', {
            valorVivienda: this.valorVivienda,
            tipoDeVivienda: TipoDeVivienda[this.tipoDeVivienda],
            ingresos: this.ingresos,
            currency: this.currency,
            tasaCompra: this.tasaCompra
        });
    }

    /**
     * Factory method estático para crear instancias de BBPCalc
     * Obtiene la tasa de cambio automáticamente cuando es necesario
     * @returns Promise<BBPCalc> - Instancia de BBPCalc inicializada
     */
    public static async crear(
        valorVivienda: number,
        tipoDeVivienda: TipoDeVivienda,
        ingresos: number,
        adultoMayor: boolean,
        personaDesplazada: boolean,
        migrantesRetornados: boolean,
        personaConDiscapacidad: boolean,
        currency: string
    ): Promise<BBPCalc> {
        // Obtener la tasa de cambio solo si la moneda es USD
        // Si es PEN, usar 1 como tasa (no se necesita conversión)
        let tasaCompra = 1;
        if (currency === 'USD') {
            tasaCompra = await currencySwitch.obtenerTasaCompra();
        }
        
        // Crear y retornar la instancia
        return new BBPCalc(
            valorVivienda,
            tipoDeVivienda,
            ingresos,
            adultoMayor,
            personaDesplazada,
            migrantesRetornados,
            personaConDiscapacidad,
            currency,
            tasaCompra
        );
    }

    public CalculoDeBono(): number {
        // Verificar elegibilidad para BBP base
        /*if (!this.esElegibleParaBBP()) {
            console.log('[BBPCalc] ❌ Usuario NO elegible para BBP (ingresos > S/4,746 y sin condición especial)');
            return 0; // No aplica ningún bono
        }*/

        let bono = this._valorDelBono;
        console.log('[BBPCalc] ✅ Usuario elegible para BBP. Valor del Bono base:', bono);
        
        // Agregar bono integrado si aplica y no es R5
        if (this.aplicaIntegrado() && this.rango !== RangosDeVivienda.R5) {
            bono += this._bonoIntegrado;
            console.log('[BBPCalc] ✅ Bono integrado aplicado. Bono total:', bono);
        }
        
        return bono;
    }



}

