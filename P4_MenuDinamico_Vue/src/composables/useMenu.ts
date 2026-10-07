import { ref, computed } from 'vue'
import type { MenuItem, MenuData } from '../types/menu'
import menuInicial from '../data/menu.json'

const ENLACE_VALIDO = /^(\/[a-zA-Z0-9\-_/]*|https?:\/\/[^\s]+)$/

function clonarMenuInicial(): MenuItem[] {
  return JSON.parse(JSON.stringify((menuInicial as MenuData).menu))
}

function recolectarIds(items: MenuItem[], acumulador: number[] = []): number[] {
  for (const item of items) {
    acumulador.push(item.id)
    if (item.submenu?.length) recolectarIds(item.submenu, acumulador)
  }
  return acumulador
}

function buscarPadre(items: MenuItem[], padreId: number): MenuItem | null {
  for (const item of items) {
    if (item.id === padreId) return item
    if (item.submenu?.length) {
      const encontrado = buscarPadre(item.submenu, padreId)
      if (encontrado) return encontrado
    }
  }
  return null
}

function eliminarPorId(items: MenuItem[], id: number): boolean {
  const indice = items.findIndex((item) => item.id === id)
  if (indice !== -1) {
    items.splice(indice, 1)
    return true
  }
  for (const item of items) {
    if (item.submenu?.length && eliminarPorId(item.submenu, id)) return true
  }
  return false
}

function buscarItem(items: MenuItem[], id: number): MenuItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.submenu?.length) {
      const encontrado = buscarItem(item.submenu, id)
      if (encontrado) return encontrado
    }
  }
  return null
}

export interface OpcionPlana {
  id: number
  etiqueta: string
  profundidad: number
}

function aplanarParaSelector(items: MenuItem[], profundidad = 0, acumulador: OpcionPlana[] = []): OpcionPlana[] {
  for (const item of items) {
    acumulador.push({ id: item.id, etiqueta: `${'— '.repeat(profundidad)}${item.nombre}`, profundidad })
    if (item.submenu?.length) aplanarParaSelector(item.submenu, profundidad + 1, acumulador)
  }
  return acumulador
}

export function validarEnlace(enlace: string): boolean {
  return ENLACE_VALIDO.test(enlace.trim())
}

/** Estado reactivo compartido del menú: todas las vistas que usen este composable ven los mismos datos. */
const items = ref<MenuItem[]>(clonarMenuInicial())
const mensajeError = ref<string>('')

export function useMenu() {
  const todosLosIds = computed(() => recolectarIds(items.value))

  function siguienteId(): number {
    const ids = todosLosIds.value
    return ids.length ? Math.max(...ids) + 1 : 1
  }

  function limpiarError() {
    mensajeError.value = ''
  }

  function agregarOpcion(nombre: string, enlace: string, icono: string, padreId: number | null): boolean {
    limpiarError()
    const nombreLimpio = nombre.trim()
    const enlaceLimpio = enlace.trim()

    if (!nombreLimpio) {
      mensajeError.value = 'El nombre de la opción es obligatorio.'
      return false
    }
    if (!enlaceLimpio || !validarEnlace(enlaceLimpio)) {
      mensajeError.value = 'El enlace debe ser una ruta interna (ej: /contacto) o una URL http(s) válida.'
      return false
    }

    const nuevaOpcion: MenuItem = {
      id: siguienteId(),
      nombre: nombreLimpio,
      enlace: enlaceLimpio,
      icono: icono.trim() || undefined,
    }

    if (padreId === null) {
      items.value.push(nuevaOpcion)
    } else {
      const padre = buscarPadre(items.value, padreId)
      if (!padre) {
        mensajeError.value = 'La opción padre seleccionada ya no existe.'
        return false
      }
      padre.submenu = padre.submenu ? [...padre.submenu, nuevaOpcion] : [nuevaOpcion]
    }
    return true
  }

  function eliminarOpcion(id: number) {
    eliminarPorId(items.value, id)
  }

  function actualizarOpcion(id: number, nombre: string, enlace: string, icono: string): boolean {
    limpiarError()
    const nombreLimpio = nombre.trim()
    const enlaceLimpio = enlace.trim()

    if (!nombreLimpio) {
      mensajeError.value = 'El nombre de la opción es obligatorio.'
      return false
    }
    if (!enlaceLimpio || !validarEnlace(enlaceLimpio)) {
      mensajeError.value = 'El enlace debe ser una ruta interna (ej: /contacto) o una URL http(s) válida.'
      return false
    }

    const item = buscarItem(items.value, id)
    if (!item) {
      mensajeError.value = 'La opción que intentas modificar ya no existe.'
      return false
    }
    item.nombre = nombreLimpio
    item.enlace = enlaceLimpio
    item.icono = icono.trim() || undefined
    return true
  }

  function obtenerOpcion(id: number): MenuItem | null {
    return buscarItem(items.value, id)
  }

  const opcionesPlanas = computed(() => aplanarParaSelector(items.value))

  function restaurarPorDefecto() {
    items.value = clonarMenuInicial()
    limpiarError()
  }

  function validarEstructura(data: unknown): data is MenuData {
    if (!data || typeof data !== 'object' || !('menu' in data)) return false
    const lista = (data as { menu: unknown }).menu
    if (!Array.isArray(lista)) return false

    const validarItems = (lista: unknown[]): boolean =>
      lista.every((item) => {
        if (!item || typeof item !== 'object') return false
        const i = item as Record<string, unknown>
        if (typeof i.id !== 'number' || typeof i.nombre !== 'string' || typeof i.enlace !== 'string') return false
        if (!validarEnlace(i.enlace)) return false
        if (i.submenu !== undefined && !Array.isArray(i.submenu)) return false
        if (Array.isArray(i.submenu) && !validarItems(i.submenu)) return false
        return true
      })

    return validarItems(lista)
  }

  function cargarDesdeJson(texto: string): boolean {
    limpiarError()
    let data: unknown
    try {
      data = JSON.parse(texto)
    } catch {
      mensajeError.value = 'El archivo no contiene un JSON válido.'
      return false
    }

    if (!validarEstructura(data)) {
      mensajeError.value =
        'La estructura del JSON no es válida. Cada opción necesita "id" (número), "nombre", "enlace" y, opcionalmente, "submenu".'
      return false
    }

    const idsRecibidos = recolectarIds(data.menu)
    const idsUnicos = new Set(idsRecibidos)
    if (idsUnicos.size !== idsRecibidos.length) {
      mensajeError.value = 'El JSON contiene identificadores ("id") duplicados.'
      return false
    }

    items.value = data.menu
    return true
  }

  return {
    items,
    mensajeError,
    opcionesPlanas,
    agregarOpcion,
    actualizarOpcion,
    eliminarOpcion,
    obtenerOpcion,
    restaurarPorDefecto,
    cargarDesdeJson,
    limpiarError,
  }
}
