export type IdProveedor = 'gemini' | 'groq' | 'extractivo'

export interface MensajeChat {
  rol: 'usuario' | 'asistente'
  contenido: string
}

/** Unidad del corpus que se entrega al modelo como contexto. */
export interface FragmentoContexto {
  id: string
  articulo: number | null
  encabezado: string
  texto: string
  puntaje: number
}

export interface SolicitudRespuesta {
  instruccionSistema: string
  historial: MensajeChat[]
  pregunta: string
  /** Artículos recuperados; el modo extractivo los muestra directamente cuando no hay IA. */
  fragmentos: FragmentoContexto[]
  senal?: AbortSignal
}

export interface RespuestaLLM {
  texto: string
  proveedor: IdProveedor
  modelo: string
  tokensEntrada?: number
  tokensSalida?: number
  motivoFin?: string
}

export interface ResultadoPrueba {
  ok: boolean
  detalle: string
  latenciaMs: number
}

export type TipoErrorProveedor = 'sin-clave' | 'clave-invalida' | 'cuota' | 'bloqueado' | 'red' | 'cancelado' | 'otro'

export class ErrorProveedor extends Error {
  readonly tipo: TipoErrorProveedor
  readonly proveedor: IdProveedor
  readonly estado?: number

  constructor(mensaje: string, tipo: TipoErrorProveedor, proveedor: IdProveedor, estado?: number) {
    super(mensaje)
    this.name = 'ErrorProveedor'
    this.tipo = tipo
    this.proveedor = proveedor
    this.estado = estado
  }

  /** Errores que justifican pasar al siguiente proveedor de la cadena. */
  get permiteRespaldo() {
    return this.tipo !== 'cancelado'
  }
}

export interface ProveedorLLM {
  readonly id: IdProveedor
  readonly nombre: string
  readonly modelo: string
  readonly disponible: boolean
  responder(solicitud: SolicitudRespuesta, alRecibirDelta: (texto: string) => void): Promise<RespuestaLLM>
  incrustar?(texto: string, senal?: AbortSignal): Promise<number[]>
  probar(): Promise<ResultadoPrueba>
}
