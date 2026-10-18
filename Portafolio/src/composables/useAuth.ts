import { computed, readonly, shallowRef } from 'vue'
import * as authStorage from '../services/authStorage'
import type { Sesion } from '../services/authStorage'

// Estado de sesión compartido por toda la aplicación (una sola instancia).
const sesion = shallowRef<Sesion | null>(authStorage.obtenerSesion())

function refrescarSesion() {
  sesion.value = authStorage.obtenerSesion()
  return sesion.value
}

// Otra pestaña que inicia o cierra sesión se refleja aquí también.
window.addEventListener('storage', (evento) => {
  if (evento.key === null || evento.key.startsWith('portafolio.')) refrescarSesion()
})

export function useAuth() {
  const usuario = computed(() => sesion.value?.usuario ?? null)
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  async function iniciarSesion(nombreUsuario: string, contrasena: string) {
    const resultado = await authStorage.iniciarSesion(nombreUsuario, contrasena)
    if (resultado.ok) sesion.value = resultado.sesion
    return resultado
  }

  function cerrarSesion() {
    authStorage.cerrarSesion()
    sesion.value = null
  }

  async function cambiarContrasena(actual: string, nueva: string, confirmacion: string) {
    if (!usuario.value) return { ok: false as const, error: 'Tu sesión venció. Vuelve a iniciar sesión.' }
    const resultado = await authStorage.cambiarContrasena(usuario.value.usuario, actual, nueva, confirmacion)
    refrescarSesion()
    return resultado
  }

  return {
    sesion: readonly(sesion),
    usuario,
    esAdmin,
    refrescarSesion,
    iniciarSesion,
    cerrarSesion,
    cambiarContrasena,
  }
}
