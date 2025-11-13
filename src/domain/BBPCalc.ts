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

interface TipoCambioResponse {
    buy_price: string;
    sell_price: string;
    base_currency: string;
    quote_currency: string;
    date: string;
}

export class currencySwitch {
    private static readonly API_KEY = process.env.API_KEY_DECOLECTA;
    private static readonly API_URL = 'https://api.decolecta.com/v1/tipo-cambio/sbs/average';
    
    /**
     * Obtiene la tasa de cambio promedio de SBS desde la API de Decolecta
     * @returns Promise<number> - Tasa de cambio promedio (promedio entre compra y venta)
     */
    public static async obtenerTasaDeCambioSBS(): Promise<number> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener tasa de cambio: ${response.status} ${response.statusText}`);
            }

            const data: TipoCambioResponse = await response.json();
            
            // Calcular promedio entre precio de compra y venta
            const buyPrice = parseFloat(data.buy_price);
            const sellPrice = parseFloat(data.sell_price);
            const promedio = (buyPrice + sellPrice) / 2;
            
            console.log('[currencySwitch] Tasa de cambio obtenida:', {
                buy_price: buyPrice,
                sell_price: sellPrice,
                promedio: promedio,
                fecha: data.date
            });
            
            return promedio;
            
        } catch (error) {
            console.error('[currencySwitch] Error al obtener tasa de cambio:', error);
            throw new Error('No se pudo obtener la tasa de cambio de SBS');
        }
    }
    
    /**
     * Obtiene la tasa de cambio de compra (para convertir PEN a USD)
     * @returns Promise<number> - Tasa de cambio de compra
     */
    public static async obtenerTasaCompra(): Promise<number> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener tasa de cambio: ${response.status} ${response.statusText}`);
            }

            const data: TipoCambioResponse = await response.json();
            return parseFloat(data.buy_price);
            
        } catch (error) {
            console.error('[currencySwitch] Error al obtener tasa de compra:', error);
            throw new Error('No se pudo obtener la tasa de cambio de compra');
        }
    }
    
    /**
     * Obtiene la tasa de cambio de venta (para convertir USD a PEN)
     * @returns Promise<number> - Tasa de cambio de venta
     */
    public static async obtenerTasaVenta(): Promise<number> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.API_KEY}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error al obtener tasa de cambio: ${response.status} ${response.statusText}`);
            }

            const data: TipoCambioResponse = await response.json();
            return parseFloat(data.sell_price);
            
        } catch (error) {
            console.error('[currencySwitch] Error al obtener tasa de venta:', error);
            throw new Error('No se pudo obtener la tasa de cambio de venta');
        }
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

    private aplicaIntegrado(): boolean{
        return this.ingresos <= 4746 || this.adultoMayor || this.personaDesplazada || this.migrantesRetornados || this.personaConDiscapacidad;
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
        let bono = this._valorDelBono;
        console.log('[BBPCalc] Valor del Bono antes de integrado:', bono);
        if (this.aplicaIntegrado() && this.rango!==RangosDeVivienda.R5) {
            bono += this._bonoIntegrado;
        }
        return bono;
    }



}

