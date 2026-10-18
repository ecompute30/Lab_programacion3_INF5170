import { leerConfiguracion, resolverClave, type ConfiguracionLLM, type OrigenClave } from '../configStorage.ts'
import { ProveedorExtractivo } from './proveedorExtractivo.ts'
import { ProveedorGemini } from './proveedorGemini.ts'
import { ProveedorOpenAICompatible } from './proveedorOpenAICompatible.ts'
import { ErrorProveedor, type IdProveedor, type ProveedorLLM, type RespuestaLLM, type SolicitudRespuesta } from './tipos.ts'

/**
 * Intenta los proveedores en orden y pasa al siguiente ante cuota agotada,
 * clave inválida, red o bloqueo (mismo patrón de degradación que la lista de
 * tareas de la Práctica 7). El modo extractivo cierra la cadena.
 */

export interface IntentoFallido {
  proveedor: IdProveedor
  nombre: string
  error: ErrorProveedor
}

export interface RespuestaCadena extends RespuestaLLM {
  intentosFallidos: IntentoFallido[]
}

export interface EstadoProveedor {
  id: IdProveedor
  nombre: string
  modelo: string
  disponible: boolean
  origenClave: OrigenClave
}

export class CadenaProveedores {
  readonly proveedores: ProveedorLLM[]
  readonly estados: EstadoProveedor[]

  constructor(proveedores: ProveedorLLM[], estados: EstadoProveedor[]) {
    this.proveedores = proveedores
    this.estados = estados
  }

  /** El primer proveedor con capacidad de embeber consultas (hoy, Gemini). */
  get embebedor(): ((texto: string, senal?: AbortSignal) => Promise<number[]>) | null {
    const p = this.proveedores.find((x) => x.disponible && x.incrustar)
    return p ? (texto, senal) => p.incrustar!(texto, senal) : null
  }

  async responder(
    solicitud: SolicitudRespuesta,
    alRecibirDelta: (texto: string) => void,
    alReiniciar: () => void = () => {},
  ): Promise<RespuestaCadena> {
    const intentosFallidos: IntentoFallido[] = []
    for (const proveedor of this.proveedores) {
      if (!proveedor.disponible) continue
      let emitio = false
      try {
        const respuesta = await proveedor.responder(solicitud, (delta) => {
          emitio = true
          alRecibirDelta(delta)
        })
        return { ...respuesta, intentosFallidos }
      } catch (error) {
        const errorProveedor =
          error instanceof ErrorProveedor ? error : new ErrorProveedor(error instanceof Error ? error.message : String(error), 'otro', proveedor.id)
        if (!errorProveedor.permiteRespaldo) throw errorProveedor
        intentosFallidos.push({ proveedor: proveedor.id, nombre: proveedor.nombre, error: errorProveedor })
        if (emitio) alReiniciar()
      }
    }
    throw new ErrorProveedor('Ningún proveedor pudo responder.', 'otro', 'extractivo')
  }
}

export async function construirCadena(config: ConfiguracionLLM = leerConfiguracion()): Promise<CadenaProveedores> {
  const gemini = await resolverClave('gemini')
  const groq = await resolverClave('groq')

  const catalogo: Record<IdProveedor, { proveedor: ProveedorLLM; origenClave: OrigenClave }> = {
    gemini: { proveedor: new ProveedorGemini(gemini.clave, config.modeloGemini, config.modeloEmbeddings), origenClave: gemini.origen },
    groq: {
      proveedor: new ProveedorOpenAICompatible('groq', 'Groq', 'https://api.groq.com/openai/v1', groq.clave, config.modeloGroq),
      origenClave: groq.origen,
    },
    extractivo: { proveedor: new ProveedorExtractivo(), origenClave: 'ninguno' },
  }

  const orden = [...new Set([...config.ordenProveedores, 'extractivo' as const])]
  const proveedores = orden.map((id) => catalogo[id].proveedor)
  const estados = orden.map((id) => {
    const { proveedor, origenClave } = catalogo[id]
    return { id, nombre: proveedor.nombre, modelo: proveedor.modelo, disponible: proveedor.disponible, origenClave }
  })
  return new CadenaProveedores(proveedores, estados)
}
