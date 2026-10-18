import { leerEventosSSE } from './sse.ts'
import { ErrorProveedor, type IdProveedor, type ProveedorLLM, type RespuestaLLM, type ResultadoPrueba, type SolicitudRespuesta } from './tipos.ts'

/**
 * Cliente mínimo del formato `chat/completions` (OpenAI). Se usa con Groq
 * como respaldo, pero sirve para cualquier API compatible cambiando la base.
 */

const MAX_TOKENS_SALIDA = 1024

interface TrozoOpenAI {
  choices?: Array<{ delta?: { content?: string | null }; finish_reason?: string | null }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
  error?: { message?: string }
}

export class ProveedorOpenAICompatible implements ProveedorLLM {
  readonly id: IdProveedor
  readonly nombre: string
  readonly modelo: string
  private readonly base: string
  private readonly clave: string | null

  constructor(id: IdProveedor, nombre: string, base: string, clave: string | null, modelo: string) {
    this.id = id
    this.nombre = nombre
    this.base = base
    this.clave = clave
    this.modelo = modelo
  }

  get disponible() {
    return Boolean(this.clave)
  }

  private cabeceras() {
    if (!this.clave) throw new ErrorProveedor(`No hay una clave de ${this.nombre} configurada.`, 'sin-clave', this.id)
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.clave}` }
  }

  private async lanzarErrorHttp(respuesta: Response): Promise<never> {
    let mensaje = `${this.nombre} respondió ${respuesta.status}.`
    try {
      const cuerpo = (await respuesta.json()) as TrozoOpenAI
      if (cuerpo.error?.message) mensaje = cuerpo.error.message
    } catch { /* cuerpo no JSON */ }
    const tipo = respuesta.status === 401 || respuesta.status === 403 ? 'clave-invalida' : respuesta.status === 429 ? 'cuota' : 'otro'
    throw new ErrorProveedor(mensaje, tipo, this.id, respuesta.status)
  }

  async responder(solicitud: SolicitudRespuesta, alRecibirDelta: (texto: string) => void): Promise<RespuestaLLM> {
    const messages = [
      { role: 'system', content: solicitud.instruccionSistema },
      ...solicitud.historial.map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.contenido })),
      { role: 'user', content: solicitud.pregunta },
    ]
    let respuesta: Response
    try {
      respuesta = await fetch(`${this.base}/chat/completions`, {
        method: 'POST',
        headers: this.cabeceras(),
        body: JSON.stringify({ model: this.modelo, messages, stream: true, max_tokens: MAX_TOKENS_SALIDA, temperature: 0.2 }),
        signal: solicitud.senal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new ErrorProveedor('Solicitud cancelada.', 'cancelado', this.id)
      throw new ErrorProveedor(`No se pudo conectar con ${this.nombre}.`, 'red', this.id)
    }
    if (!respuesta.ok) await this.lanzarErrorHttp(respuesta)
    if (!respuesta.body) throw new ErrorProveedor(`${this.nombre} no devolvió contenido.`, 'otro', this.id)

    let texto = ''
    let motivoFin: string | undefined
    let tokensEntrada: number | undefined
    let tokensSalida: number | undefined
    try {
      for await (const trozo of leerEventosSSE<TrozoOpenAI>(respuesta.body)) {
        if (trozo.error?.message) throw new ErrorProveedor(trozo.error.message, 'otro', this.id)
        const delta = trozo.choices?.[0]?.delta?.content ?? ''
        if (delta) {
          texto += delta
          alRecibirDelta(delta)
        }
        const fin = trozo.choices?.[0]?.finish_reason
        if (fin) motivoFin = fin
        if (trozo.usage) {
          tokensEntrada = trozo.usage.prompt_tokens
          tokensSalida = trozo.usage.completion_tokens
        }
      }
    } catch (error) {
      if (error instanceof ErrorProveedor) throw error
      if (error instanceof DOMException && error.name === 'AbortError') throw new ErrorProveedor('Respuesta cancelada.', 'cancelado', this.id)
      throw new ErrorProveedor(`Se interrumpió el flujo de respuesta de ${this.nombre}.`, 'red', this.id)
    }
    return { texto, proveedor: this.id, modelo: this.modelo, tokensEntrada, tokensSalida, motivoFin }
  }

  async probar(): Promise<ResultadoPrueba> {
    const inicio = performance.now()
    try {
      let respuesta: Response
      try {
        respuesta = await fetch(`${this.base}/models/${this.modelo}`, { headers: this.cabeceras() })
      } catch {
        throw new ErrorProveedor(`No se pudo conectar con ${this.nombre}.`, 'red', this.id)
      }
      if (!respuesta.ok) await this.lanzarErrorHttp(respuesta)
      return { ok: true, latenciaMs: Math.round(performance.now() - inicio), detalle: `${this.modelo} disponible en ${this.nombre}.` }
    } catch (error) {
      return { ok: false, latenciaMs: Math.round(performance.now() - inicio), detalle: error instanceof Error ? error.message : String(error) }
    }
  }
}
