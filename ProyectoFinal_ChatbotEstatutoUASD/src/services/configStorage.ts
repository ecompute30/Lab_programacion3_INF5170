import type { IdProveedor } from './llm/tipos.ts'

/**
 * Configuración del asistente. Lo no sensible (proveedores, modelos) va en
 * localStorage en claro. Las claves de API se cifran con AES-GCM usando una
 * CryptoKey NO extraíble que vive en IndexedDB de este navegador: copiar el
 * localStorage a otra máquina no sirve para recuperarlas, pero cualquier
 * usuario autenticado en este navegador puede usarlas (hace falta para que
 * la revisora use la app sin conocer la clave).
 */

export interface ConfiguracionLLM {
  ordenProveedores: IdProveedor[]
  modeloGemini: string
  modeloGroq: string
  modeloEmbeddings: string
  mostrarTraza: boolean
}

const CLAVE_CONFIG = 'primada.config'
const PREFIJO_SECRETO = 'primada.secreto.'
const BD = 'primada'
const ALMACEN = 'claves'
const ID_CLAVE_DISPOSITIVO = 'dispositivo'

const env = import.meta.env as Record<string, string | undefined>

export const CONFIG_POR_DEFECTO: ConfiguracionLLM = {
  ordenProveedores: ['gemini', 'groq', 'extractivo'],
  modeloGemini: env.VITE_GEMINI_MODELO || 'gemini-3.5-flash-lite',
  modeloGroq: env.VITE_GROQ_MODELO || 'llama-3.3-70b-versatile',
  modeloEmbeddings: env.VITE_GEMINI_MODELO_EMBEDDINGS || 'gemini-embedding-2',
  mostrarTraza: false,
}

export function leerConfiguracion(): ConfiguracionLLM {
  try {
    const crudo = localStorage.getItem(CLAVE_CONFIG)
    return crudo ? { ...CONFIG_POR_DEFECTO, ...(JSON.parse(crudo) as Partial<ConfiguracionLLM>) } : { ...CONFIG_POR_DEFECTO }
  } catch {
    return { ...CONFIG_POR_DEFECTO }
  }
}

export function guardarConfiguracion(config: ConfiguracionLLM) {
  localStorage.setItem(CLAVE_CONFIG, JSON.stringify(config))
}

/* ---------- Secretos cifrados por dispositivo ---------- */

function abrirBaseDatos(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open(BD, 1)
    solicitud.onupgradeneeded = () => solicitud.result.createObjectStore(ALMACEN)
    solicitud.onsuccess = () => resolver(solicitud.result)
    solicitud.onerror = () => rechazar(solicitud.error)
  })
}

function transaccion<T>(modo: IDBTransactionMode, operacion: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return abrirBaseDatos().then(
    (bd) =>
      new Promise<T>((resolver, rechazar) => {
        const solicitud = operacion(bd.transaction(ALMACEN, modo).objectStore(ALMACEN))
        solicitud.onsuccess = () => resolver(solicitud.result)
        solicitud.onerror = () => rechazar(solicitud.error)
      }),
  )
}

let claveDispositivo: Promise<CryptoKey> | null = null

function obtenerClaveDispositivo(): Promise<CryptoKey> {
  claveDispositivo ??= (async () => {
    const existente = await transaccion<CryptoKey | undefined>('readonly', (a) => a.get(ID_CLAVE_DISPOSITIVO))
    if (existente) return existente
    const nueva = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    await transaccion('readwrite', (a) => a.put(nueva, ID_CLAVE_DISPOSITIVO))
    return nueva
  })().catch((error) => {
    claveDispositivo = null
    throw error
  })
  return claveDispositivo
}

const aBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const desdeBase64 = (texto: string) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0))

export async function guardarSecreto(nombre: string, valor: string) {
  const clave = await obtenerClaveDispositivo()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, new TextEncoder().encode(valor))
  localStorage.setItem(PREFIJO_SECRETO + nombre, `${aBase64(iv)}.${aBase64(new Uint8Array(cifrado))}`)
}

export async function leerSecreto(nombre: string): Promise<string | null> {
  const crudo = localStorage.getItem(PREFIJO_SECRETO + nombre)
  if (!crudo) return null
  try {
    const [iv, cifrado] = crudo.split('.')
    const clave = await obtenerClaveDispositivo()
    const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: desdeBase64(iv!) }, clave, desdeBase64(cifrado!))
    return new TextDecoder().decode(plano)
  } catch {
    // La clave del dispositivo cambió (otro navegador o IndexedDB borrado): el secreto ya no es legible.
    localStorage.removeItem(PREFIJO_SECRETO + nombre)
    return null
  }
}

export function borrarSecreto(nombre: string) {
  localStorage.removeItem(PREFIJO_SECRETO + nombre)
}

export function existeSecreto(nombre: string) {
  return localStorage.getItem(PREFIJO_SECRETO + nombre) !== null
}

/* ---------- Resolución de claves de API ---------- */

export type OrigenClave = 'dispositivo' | 'build' | 'ninguno'

const VARIABLE_BUILD: Record<Exclude<IdProveedor, 'extractivo'>, string> = {
  gemini: 'VITE_GEMINI_API_KEY_B64',
  groq: 'VITE_GROQ_API_KEY_B64',
}

/** Acepta la clave en base64 (lo previsto) o en claro, si el valor no decodifica a texto imprimible. */
function claveDelBuild(proveedor: Exclude<IdProveedor, 'extractivo'>): string | null {
  const valor = env[VARIABLE_BUILD[proveedor]]?.trim()
  if (!valor) return null
  try {
    const decodificada = atob(valor)
    if (decodificada && /^[\x21-\x7e]+$/.test(decodificada)) return decodificada
  } catch {
    // No era base64.
  }
  return valor
}

/** Primero la clave guardada por el admin en este dispositivo; si no, la del build (base64); si no, ninguna. */
export async function resolverClave(proveedor: Exclude<IdProveedor, 'extractivo'>): Promise<{ clave: string | null; origen: OrigenClave }> {
  const delDispositivo = await leerSecreto(proveedor)
  if (delDispositivo) return { clave: delDispositivo, origen: 'dispositivo' }
  const delBuild = claveDelBuild(proveedor)
  if (delBuild) return { clave: delBuild, origen: 'build' }
  return { clave: null, origen: 'ninguno' }
}
