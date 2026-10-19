import { computed, shallowRef, watch, type Ref } from 'vue'
import {
  crearConversacion,
  eliminarConversacion,
  eliminarTodas,
  guardarConversacion,
  listarConversaciones,
  tituloDesdePregunta,
  type Conversacion,
  type MensajeGuardado,
} from '../services/conversacionesStorage.ts'

export function useConversaciones(usuario: Readonly<Ref<string>>) {
  const lista = shallowRef<Conversacion[]>(listarConversaciones(usuario.value))
  const idActual = shallowRef<string | null>(null)

  watch(usuario, (u) => {
    lista.value = listarConversaciones(u)
    idActual.value = null
  })

  const actual = computed(() => lista.value.find((c) => c.id === idActual.value) ?? null)
  const mensajes = computed(() => actual.value?.mensajes ?? [])

  function seleccionar(id: string | null) {
    idActual.value = id
  }

  function nueva() {
    const conversacion = crearConversacion(usuario.value)
    lista.value = listarConversaciones(usuario.value)
    idActual.value = conversacion.id
    return conversacion
  }

  /** Garantiza una conversación activa antes de escribir en ella. */
  function asegurarActual(): Conversacion {
    return actual.value ?? nueva()
  }

  function persistir(conversacion: Conversacion) {
    guardarConversacion(usuario.value, conversacion)
    lista.value = listarConversaciones(usuario.value)
  }

  function agregarMensaje(mensaje: MensajeGuardado) {
    const conversacion = asegurarActual()
    const titulo =
      conversacion.mensajes.length === 0 && mensaje.rol === 'usuario' ? tituloDesdePregunta(mensaje.contenido) : conversacion.titulo
    persistir({ ...conversacion, titulo, mensajes: [...conversacion.mensajes, mensaje] })
  }

  function actualizarMensaje(id: string, cambios: Partial<MensajeGuardado>) {
    const conversacion = actual.value
    if (!conversacion) return
    persistir({ ...conversacion, mensajes: conversacion.mensajes.map((m) => (m.id === id ? { ...m, ...cambios } : m)) })
  }

  function renombrar(id: string, titulo: string) {
    const conversacion = lista.value.find((c) => c.id === id)
    if (conversacion && titulo.trim()) persistir({ ...conversacion, titulo: titulo.trim() })
  }

  function eliminar(id: string) {
    eliminarConversacion(usuario.value, id)
    lista.value = listarConversaciones(usuario.value)
    if (idActual.value === id) idActual.value = null
  }

  function vaciarTodo() {
    eliminarTodas(usuario.value)
    lista.value = []
    idActual.value = null
  }

  return { lista, actual, mensajes, idActual, seleccionar, nueva, asegurarActual, agregarMensaje, actualizarMensaje, renombrar, eliminar, vaciarTodo }
}

export type ApiConversaciones = ReturnType<typeof useConversaciones>
