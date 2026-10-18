/**
 * Autenticación simulada sobre localStorage. No hay backend: las cuentas viven
 * en el navegador, pero se tratan como lo haría un servidor real — contraseñas
 * derivadas con PBKDF2 y sal aleatoria, sesión con token y vencimiento, y
 * bloqueo temporal tras varios intentos fallidos.
 */

export type Rol = 'admin' | 'revisor'

export interface UsuarioPublico {
  usuario: string
  nombre: string
  rol: Rol
  contrasenaActualizadaEn: string
}

interface UsuarioAlmacenado extends UsuarioPublico {
  sal: string
  hash: string
  intentosFallidos: number
  bloqueadoHasta: number | null
}

export interface Sesion {
  token: string
  usuario: UsuarioPublico
  iniciadaEn: number
  expiraEn: number
}

export type ResultadoInicioSesion =
  | { ok: true; sesion: Sesion }
  | { ok: false; motivo: 'credenciales' | 'bloqueado'; segundosRestantes?: number; intentosRestantes?: number }

export type ResultadoCambioContrasena =
  | { ok: true }
  | { ok: false; error: string }

const CLAVE_USUARIOS = 'portafolio.usuarios'
const CLAVE_SESION = 'portafolio.sesion'

const DURACION_SESION_MS = 8 * 60 * 60 * 1000
const MAX_INTENTOS = 5
const DURACION_BLOQUEO_MS = 60 * 1000
const ITERACIONES_PBKDF2 = 120_000
export const LONGITUD_MINIMA_CONTRASENA = 5

const CUENTAS_INICIALES: Array<{ usuario: string; nombre: string; rol: Rol; contrasena: string }> = [
  { usuario: 'mconcepcion', nombre: 'M. Concepción', rol: 'revisor', contrasena: '12345' },
  { usuario: 'admin', nombre: 'Administrador', rol: 'admin', contrasena: 'admin' },
]

function aHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function desdeHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

async function derivarHash(contrasena: string, salHex: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: desdeHex(salHex), iterations: ITERACIONES_PBKDF2, hash: 'SHA-256' },
    material,
    256,
  )
  return aHex(bits)
}

async function crearCredenciales(contrasena: string) {
  const sal = aHex(crypto.getRandomValues(new Uint8Array(16)))
  return { sal, hash: await derivarHash(contrasena, sal) }
}

/** Comparación en tiempo constante para no filtrar por cuánto tarda en fallar. */
function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferencia === 0
}

function leerUsuarios(): UsuarioAlmacenado[] | null {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIOS)
    return crudo ? (JSON.parse(crudo) as UsuarioAlmacenado[]) : null
  } catch {
    return null
  }
}

function guardarUsuarios(usuarios: UsuarioAlmacenado[]) {
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios))
}

function aPublico({ usuario, nombre, rol, contrasenaActualizadaEn }: UsuarioAlmacenado): UsuarioPublico {
  return { usuario, nombre, rol, contrasenaActualizadaEn }
}

async function crearCuentaInicial(cuenta: (typeof CUENTAS_INICIALES)[number]): Promise<UsuarioAlmacenado> {
  return {
    usuario: cuenta.usuario,
    nombre: cuenta.nombre,
    rol: cuenta.rol,
    contrasenaActualizadaEn: new Date().toISOString(),
    intentosFallidos: 0,
    bloqueadoHasta: null,
    ...(await crearCredenciales(cuenta.contrasena)),
  }
}

let inicializacion: Promise<UsuarioAlmacenado[]> | null = null

/** Siembra las cuentas iniciales la primera vez y completa las que falten. */
function asegurarUsuarios(): Promise<UsuarioAlmacenado[]> {
  inicializacion ??= (async () => {
    const existentes = leerUsuarios() ?? []
    const faltantes = CUENTAS_INICIALES.filter((c) => !existentes.some((u) => u.usuario === c.usuario))
    if (faltantes.length === 0) return existentes
    const usuarios = [...existentes, ...(await Promise.all(faltantes.map(crearCuentaInicial)))]
    guardarUsuarios(usuarios)
    return usuarios
  })().finally(() => {
    inicializacion = null
  })
  return inicializacion
}

function normalizarUsuario(usuario: string) {
  return usuario.trim().toLowerCase()
}

export async function iniciarSesion(usuarioEntrada: string, contrasena: string): Promise<ResultadoInicioSesion> {
  const usuarios = await asegurarUsuarios()
  const usuario = usuarios.find((u) => u.usuario === normalizarUsuario(usuarioEntrada))

  // Un usuario inexistente también paga el costo del hash para no revelar qué cuentas existen.
  if (!usuario) {
    await derivarHash(contrasena, '00'.repeat(16))
    return { ok: false, motivo: 'credenciales' }
  }

  const ahora = Date.now()
  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
    return { ok: false, motivo: 'bloqueado', segundosRestantes: Math.ceil((usuario.bloqueadoHasta - ahora) / 1000) }
  }

  const hash = await derivarHash(contrasena, usuario.sal)
  if (!igualesSeguro(hash, usuario.hash)) {
    usuario.intentosFallidos += 1
    if (usuario.intentosFallidos >= MAX_INTENTOS) {
      usuario.intentosFallidos = 0
      usuario.bloqueadoHasta = ahora + DURACION_BLOQUEO_MS
      guardarUsuarios(usuarios)
      return { ok: false, motivo: 'bloqueado', segundosRestantes: DURACION_BLOQUEO_MS / 1000 }
    }
    guardarUsuarios(usuarios)
    return { ok: false, motivo: 'credenciales', intentosRestantes: MAX_INTENTOS - usuario.intentosFallidos }
  }

  usuario.intentosFallidos = 0
  usuario.bloqueadoHasta = null
  guardarUsuarios(usuarios)

  const sesion: Sesion = {
    token: crypto.randomUUID(),
    usuario: aPublico(usuario),
    iniciadaEn: ahora,
    expiraEn: ahora + DURACION_SESION_MS,
  }
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  return { ok: true, sesion }
}

/** Devuelve la sesión vigente, o null si no existe, venció o su cuenta ya no está. */
export function obtenerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE_SESION)
    if (!crudo) return null
    const sesion = JSON.parse(crudo) as Sesion
    const cuenta = leerUsuarios()?.find((u) => u.usuario === sesion.usuario?.usuario)
    if (!cuenta || sesion.expiraEn <= Date.now()) {
      localStorage.removeItem(CLAVE_SESION)
      return null
    }
    return { ...sesion, usuario: aPublico(cuenta) }
  } catch {
    localStorage.removeItem(CLAVE_SESION)
    return null
  }
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION)
}

export function validarNuevaContrasena(nueva: string, confirmacion: string): string | null {
  if (nueva.length < LONGITUD_MINIMA_CONTRASENA) {
    return `La contraseña nueva debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`
  }
  if (nueva !== confirmacion) return 'La confirmación no coincide con la contraseña nueva.'
  return null
}

export async function cambiarContrasena(
  usuarioObjetivo: string,
  actual: string,
  nueva: string,
  confirmacion: string,
): Promise<ResultadoCambioContrasena> {
  const sesion = obtenerSesion()
  if (!sesion || sesion.usuario.usuario !== usuarioObjetivo) {
    return { ok: false, error: 'Tu sesión venció. Vuelve a iniciar sesión.' }
  }

  const errorValidacion = validarNuevaContrasena(nueva, confirmacion)
  if (errorValidacion) return { ok: false, error: errorValidacion }

  const usuarios = await asegurarUsuarios()
  const usuario = usuarios.find((u) => u.usuario === usuarioObjetivo)
  if (!usuario) return { ok: false, error: 'La cuenta ya no existe.' }

  if (!igualesSeguro(await derivarHash(actual, usuario.sal), usuario.hash)) {
    return { ok: false, error: 'La contraseña actual no es correcta.' }
  }
  if (actual === nueva) return { ok: false, error: 'La contraseña nueva debe ser distinta de la actual.' }

  Object.assign(usuario, await crearCredenciales(nueva), { contrasenaActualizadaEn: new Date().toISOString() })
  guardarUsuarios(usuarios)
  return { ok: true }
}

export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  return (await asegurarUsuarios()).map(aPublico)
}

/** Solo un administrador puede devolver una cuenta a su contraseña inicial. */
export async function restablecerContrasena(usuarioObjetivo: string): Promise<ResultadoCambioContrasena> {
  if (obtenerSesion()?.usuario.rol !== 'admin') {
    return { ok: false, error: 'Solo un administrador puede restablecer contraseñas.' }
  }
  const cuentaInicial = CUENTAS_INICIALES.find((c) => c.usuario === usuarioObjetivo)
  const usuarios = await asegurarUsuarios()
  const usuario = usuarios.find((u) => u.usuario === usuarioObjetivo)
  if (!cuentaInicial || !usuario) return { ok: false, error: 'La cuenta no existe.' }

  Object.assign(usuario, await crearCredenciales(cuentaInicial.contrasena), {
    contrasenaActualizadaEn: new Date().toISOString(),
    intentosFallidos: 0,
    bloqueadoHasta: null,
  })
  guardarUsuarios(usuarios)
  return { ok: true }
}
