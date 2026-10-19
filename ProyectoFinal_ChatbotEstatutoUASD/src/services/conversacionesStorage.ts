import type { IdProveedor } from './llm/tipos.ts'

/** Conversaciones por usuario, persistidas en localStorage (como el historial del Portafolio). */

export interface CitaGuardada {
  articulo: number
  encabezado: string
}

export interface MensajeGuardado {
  id: string
  rol: 'usuario' | 'asistente'
  contenido: string
  creadoEn: string
  /** Solo en respuestas del asistente. */
  citas?: number[]
  fragmentos?: Array<{ id: string; articulo: number | null; encabezado: string }>
  proveedor?: IdProveedor
  modelo?: string
  duracionMs?: number
  error?: string
  incompleto?: boolean
}

export interface Conversacion {
  id: string
  titulo: string
  creadaEn: string
  actualizadaEn: string
  mensajes: MensajeGuardado[]
}

const PREFIJO = 'primada.conversaciones.'
const MAX_CONVERSACIONES = 50
const LONGITUD_TITULO = 60

const clave = (usuario: string) => `${PREFIJO}${usuario}`

export function listarConversaciones(usuario: string): Conversacion[] {
  try {
    const crudo = localStorage.getItem(clave(usuario))
    const lista = crudo ? (JSON.parse(crudo) as Conversacion[]) : []
    return lista.sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
  } catch {
    return []
  }
}

function guardarTodas(usuario: string, conversaciones: Conversacion[]) {
  const recortadas = conversaciones
    .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
    .slice(0, MAX_CONVERSACIONES)
  localStorage.setItem(clave(usuario), JSON.stringify(recortadas))
}

export function crearConversacion(usuario: string): Conversacion {
  const ahora = new Date().toISOString()
  const nueva: Conversacion = { id: crypto.randomUUID(), titulo: 'Nueva conversación', creadaEn: ahora, actualizadaEn: ahora, mensajes: [] }
  guardarTodas(usuario, [nueva, ...listarConversaciones(usuario)])
  return nueva
}

export function guardarConversacion(usuario: string, conversacion: Conversacion) {
  const resto = listarConversaciones(usuario).filter((c) => c.id !== conversacion.id)
  guardarTodas(usuario, [{ ...conversacion, actualizadaEn: new Date().toISOString() }, ...resto])
}

export function eliminarConversacion(usuario: string, id: string) {
  guardarTodas(usuario, listarConversaciones(usuario).filter((c) => c.id !== id))
}

export function eliminarTodas(usuario: string) {
  localStorage.removeItem(clave(usuario))
}

export function tituloDesdePregunta(pregunta: string): string {
  const limpio = pregunta.replace(/\s+/g, ' ').replace(/^[¿?¡!\s]+|[?!.\s]+$/g, '').trim()
  if (!limpio) return 'Nueva conversación'
  const conMayuscula = limpio.charAt(0).toUpperCase() + limpio.slice(1)
  return conMayuscula.length > LONGITUD_TITULO ? `${conMayuscula.slice(0, LONGITUD_TITULO - 1).trimEnd()}…` : conMayuscula
}
