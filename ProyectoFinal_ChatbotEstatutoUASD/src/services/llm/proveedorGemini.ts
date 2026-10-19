import { leerEventosSSE } from './sse.ts'
import { ErrorProveedor, type ProveedorLLM, type RespuestaLLM, type ResultadoPrueba, type SolicitudRespuesta } from './tipos.ts'

/**
 * Gemini vía REST directo desde el navegador (la API envía cabeceras CORS).
 * Streaming con `streamGenerateContent?alt=sse`; embeddings con `embedContent`.
 */

const BASE = 'https://generativelanguage.googleapis.com/v1beta'
const MAX_TOKENS_SALIDA = 1024

interface RespuestaGemini {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
  promptFeedback?: { blockReason?: string }
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
  error?: { code?: number; message?: string; status?: string }
}

export class ProveedorGemini implements ProveedorLLM {
  readonly id = 'gemini' as const
  readonly nombre = 'Google Gemini'
  readonly modelo: string
  private readonly clave: string | null
  private readonly modeloEmbeddings: string

  constructor(clave: string | null, modelo: string, modeloEmbeddings: string) {
    this.clave = clave
    this.modelo = modelo
    this.modeloEmbeddings = modeloEmbeddings
  }

  get disponible() {
    return Boolean(this.clave)
  }

  private cabeceras() {
    if (!this.clave) throw new ErrorProveedor('No hay una clave de Gemini configurada.', 'sin-clave', this.id)
    return { 'Content-Type': 'application/json', 'x-goog-api-key': this.clave }
  }

  private async lanzarErrorHttp(respuesta: Response): Promise<never> {
    let mensaje = `Gemini respondió ${respuesta.status}.`
    try {
      const cuerpo = (await respuesta.json()) as RespuestaGemini
      if (cuerpo.error?.message) mensaje = cuerpo.error.message
    } catch { /* cuerpo no JSON */ }
    const tipo =
      respuesta.status === 400 && /api key/i.test(mensaje) ? 'clave-invalida'
      : respuesta.status === 401 || respuesta.status === 403 ? 'clave-invalida'
      : respuesta.status === 429 ? 'cuota'
      : 'otro'
    throw new ErrorProveedor(mensaje, tipo, this.id, respuesta.status)
  }

  private async pedir(ruta: string, cuerpo: unknown, senal?: AbortSignal): Promise<Response> {
    let respuesta: Response
    try {
      respuesta = await fetch(`${BASE}/${ruta}`, { method: 'POST', headers: this.cabeceras(), body: JSON.stringify(cuerpo), signal: senal })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw new ErrorProveedor('Solicitud cancelada.', 'cancelado', this.id)
      throw new ErrorProveedor('No se pudo conectar con Gemini (sin red o bloqueado por el navegador).', 'red', this.id)
    }
    if (!respuesta.ok) await this.lanzarErrorHttp(respuesta)
    return respuesta
  }

  async responder(solicitud: SolicitudRespuesta, alRecibirDelta: (texto: string) => void): Promise<RespuestaLLM> {
    const contents = [
      ...solicitud.historial.map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'model', parts: [{ text: m.contenido }] })),
      { role: 'user', parts: [{ text: solicitud.pregunta }] },
    ]
    const respuesta = await this.pedir(
      `models/${this.modelo}:streamGenerateContent?alt=sse`,
      {
        systemInstruction: { parts: [{ text: solicitud.instruccionSistema }] },
        contents,
        generationConfig: { maxOutputTokens: MAX_TOKENS_SALIDA },
      },
      solicitud.senal,
    )
    if (!respuesta.body) throw new ErrorProveedor('Gemini no devolvió contenido.', 'otro', this.id)

    let texto = ''
    let motivoFin: string | undefined
    let tokensEntrada: number | undefined
    let tokensSalida: number | undefined
    try {
      for await (const trozo of leerEventosSSE<RespuestaGemini>(respuesta.body)) {
        if (trozo.promptFeedback?.blockReason) {
          throw new ErrorProveedor(`Gemini bloqueó la solicitud (${trozo.promptFeedback.blockReason}).`, 'bloqueado', this.id)
        }
        const candidato = trozo.candidates?.[0]
        const delta = candidato?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
        if (delta) {
          texto += delta
          alRecibirDelta(delta)
        }
        if (candidato?.finishReason) motivoFin = candidato.finishReason
        if (trozo.usageMetadata) {
          tokensEntrada = trozo.usageMetadata.promptTokenCount
          tokensSalida = trozo.usageMetadata.candidatesTokenCount
        }
      }
    } catch (error) {
      if (error instanceof ErrorProveedor) throw error
      if (error instanceof DOMException && error.name === 'AbortError') throw new ErrorProveedor('Respuesta cancelada.', 'cancelado', this.id)
      throw new ErrorProveedor('Se interrumpió el flujo de respuesta de Gemini.', 'red', this.id)
    }
    if (!texto.trim()) {
      const motivo = motivoFin && motivoFin !== 'STOP' ? motivoFin : 'respuesta vacía'
      throw new ErrorProveedor(`Gemini terminó sin texto (${motivo}).`, motivoFin === 'MAX_TOKENS' ? 'otro' : 'bloqueado', this.id)
    }
    return { texto, proveedor: this.id, modelo: this.modelo, tokensEntrada, tokensSalida, motivoFin }
  }

  async incrustar(texto: string, senal?: AbortSignal): Promise<number[]> {
    const respuesta = await this.pedir(
      `models/${this.modeloEmbeddings}:embedContent`,
      {
        model: `models/${this.modeloEmbeddings}`,
        content: { parts: [{ text: `task: question answering | query: ${texto}` }] },
        outputDimensionality: 768,
      },
      senal,
    )
    const datos = (await respuesta.json()) as { embedding?: { values?: number[] } }
    if (!datos.embedding?.values) throw new ErrorProveedor('Gemini no devolvió el vector de la consulta.', 'otro', this.id)
    return datos.embedding.values
  }

  /** Consulta la ficha del modelo: valida clave y restricciones sin gastar tokens. */
  async probar(): Promise<ResultadoPrueba> {
    const inicio = performance.now()
    try {
      let respuesta: Response
      try {
        respuesta = await fetch(`${BASE}/models/${this.modelo}`, { headers: this.cabeceras() })
      } catch {
        throw new ErrorProveedor('No se pudo conectar con Gemini.', 'red', this.id)
      }
      if (!respuesta.ok) await this.lanzarErrorHttp(respuesta)
      const ficha = (await respuesta.json()) as { displayName?: string; inputTokenLimit?: number }
      return {
        ok: true,
        latenciaMs: Math.round(performance.now() - inicio),
        detalle: `${ficha.displayName ?? this.modelo} disponible (contexto ${ficha.inputTokenLimit?.toLocaleString('es-DO') ?? '?'} tokens).`,
      }
    } catch (error) {
      return { ok: false, latenciaMs: Math.round(performance.now() - inicio), detalle: error instanceof Error ? error.message : String(error) }
    }
  }
}
