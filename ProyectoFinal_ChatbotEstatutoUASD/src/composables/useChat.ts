import { computed, shallowRef } from 'vue'
import { obtenerCadena } from './useConfiguracion.ts'
import type { ApiConversaciones } from './useConversaciones.ts'
import { cargarCorpus } from '../services/corpus.ts'
import type { MensajeGuardado } from '../services/conversacionesStorage.ts'
import { construirInstruccionSistema, extraerCitas } from '../services/llm/promptSistema.ts'
import { ErrorProveedor, type IdProveedor, type MensajeChat } from '../services/llm/tipos.ts'
import type { TrazaRecuperacion } from '../services/recuperacion/recuperar.ts'
import type { IntentoFallido } from '../services/llm/cadenaProveedores.ts'

export type Etapa = 'recuperando' | 'redactando' | null

export interface TrazaRespuesta {
  recuperacion: TrazaRecuperacion
  fragmentos: Array<{ id: string; articulo: number | null; encabezado: string; puntaje: number }>
  proveedor: IdProveedor | null
  modelo: string | null
  intentosFallidos: IntentoFallido[]
  duracionMs: number
  tokensEntrada?: number
  tokensSalida?: number
}

const TURNOS_HISTORIAL = 6
const INTERVALO_PERSISTENCIA_MS = 300

const MENSAJES_ERROR: Record<ErrorProveedor['tipo'], string> = {
  'sin-clave': 'No hay ningún proveedor de inteligencia artificial configurado. Pida al administrador que agregue una clave en Configuración.',
  'clave-invalida': 'La clave del proveedor de IA no es válida o no está autorizada para este sitio.',
  cuota: 'Se alcanzó el límite de uso del proveedor de IA. Intente de nuevo en unos minutos.',
  bloqueado: 'El proveedor de IA no pudo generar una respuesta para esta pregunta.',
  red: 'No hay conexión con el proveedor de IA. Revise su conexión e intente otra vez.',
  cancelado: 'Respuesta cancelada.',
  otro: 'Ocurrió un error al generar la respuesta. Intente de nuevo.',
}

export function useChat(conversaciones: ApiConversaciones) {
  const enviando = shallowRef(false)
  const etapa = shallowRef<Etapa>(null)
  const ultimaTraza = shallowRef<TrazaRespuesta | null>(null)
  const errorCorpus = shallowRef<string | null>(null)
  let controlador: AbortController | null = null

  const puedeEnviar = computed(() => !enviando.value)

  function historialReciente(): MensajeChat[] {
    return conversaciones.mensajes.value
      .filter((m) => !m.error && !m.incompleto && m.contenido.trim())
      .slice(-TURNOS_HISTORIAL)
      .map((m) => ({ rol: m.rol, contenido: m.contenido }))
  }

  function preguntaAnterior(): string | undefined {
    return [...conversaciones.mensajes.value].reverse().find((m) => m.rol === 'usuario')?.contenido
  }

  async function enviar(textoPregunta: string) {
    const pregunta = textoPregunta.trim()
    if (!pregunta || enviando.value) return

    enviando.value = true
    etapa.value = 'recuperando'
    controlador = new AbortController()
    const inicio = performance.now()

    const anterior = preguntaAnterior()
    const historial = historialReciente()
    conversaciones.agregarMensaje({ id: crypto.randomUUID(), rol: 'usuario', contenido: pregunta, creadoEn: new Date().toISOString() })
    const idRespuesta = crypto.randomUUID()
    conversaciones.agregarMensaje({ id: idRespuesta, rol: 'asistente', contenido: '', creadoEn: new Date().toISOString(), incompleto: true })

    let contenido = ''
    let ultimaPersistencia = 0
    const persistir = (forzar = false) => {
      const ahora = performance.now()
      if (!forzar && ahora - ultimaPersistencia < INTERVALO_PERSISTENCIA_MS) return
      ultimaPersistencia = ahora
      conversaciones.actualizarMensaje(idRespuesta, { contenido })
    }

    try {
      const [{ recuperador }, cadena] = await Promise.all([cargarCorpus(), obtenerCadena()])
      errorCorpus.value = null
      const embebedor = cadena.embebedor
      const { fragmentos, traza } = await recuperador.recuperar(pregunta, {
        embeberConsulta: embebedor ? (t) => embebedor(t, controlador!.signal) : undefined,
        preguntaAnterior: anterior,
      })
      if (controlador.signal.aborted) throw new ErrorProveedor('Respuesta cancelada.', 'cancelado', 'extractivo')

      etapa.value = 'redactando'
      const respuesta = await cadena.responder(
        { instruccionSistema: construirInstruccionSistema(fragmentos), historial, pregunta, fragmentos, senal: controlador.signal },
        (delta) => {
          contenido += delta
          persistir()
        },
        () => {
          contenido = ''
          persistir(true)
        },
      )

      const duracionMs = Math.round(performance.now() - inicio)
      const citas = extraerCitas(respuesta.texto)
      conversaciones.actualizarMensaje(idRespuesta, {
        contenido: respuesta.texto,
        incompleto: false,
        citas,
        fragmentos: fragmentos.map((f) => ({ id: f.id, articulo: f.articulo, encabezado: f.encabezado })),
        proveedor: respuesta.proveedor,
        modelo: respuesta.modelo,
        duracionMs,
      })
      ultimaTraza.value = {
        recuperacion: traza,
        fragmentos: fragmentos.map((f) => ({ id: f.id, articulo: f.articulo, encabezado: f.encabezado, puntaje: f.puntaje })),
        proveedor: respuesta.proveedor,
        modelo: respuesta.modelo,
        intentosFallidos: respuesta.intentosFallidos,
        duracionMs,
        tokensEntrada: respuesta.tokensEntrada,
        tokensSalida: respuesta.tokensSalida,
      }
    } catch (error) {
      const tipo = error instanceof ErrorProveedor ? error.tipo : 'otro'
      if (!(error instanceof ErrorProveedor)) errorCorpus.value = error instanceof Error ? error.message : String(error)
      conversaciones.actualizarMensaje(idRespuesta, {
        contenido,
        incompleto: false,
        error: tipo === 'cancelado' && contenido ? undefined : MENSAJES_ERROR[tipo],
      })
    } finally {
      enviando.value = false
      etapa.value = null
      controlador = null
    }
  }

  function cancelar() {
    controlador?.abort()
  }

  async function reintentar(mensaje: MensajeGuardado) {
    const indice = conversaciones.mensajes.value.findIndex((m) => m.id === mensaje.id)
    const previa = [...conversaciones.mensajes.value.slice(0, indice)].reverse().find((m) => m.rol === 'usuario')
    if (previa) await enviar(previa.contenido)
  }

  return { enviando, etapa, puedeEnviar, ultimaTraza, errorCorpus, enviar, cancelar, reintentar }
}
