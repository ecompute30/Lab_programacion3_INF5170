import { computed, shallowRef, watch, type Ref } from 'vue'
import {
  borrarBusquedasRecientes,
  buscar,
  cargarCatalogo,
  leerBusquedasRecientes,
  registrarBusqueda,
} from '../services/catalogoStorage'
import type { Categoria } from '../types/proyecto'

const ESPERA_REGISTRO_MS = 1200

export function useBusquedaProyectos(usuario: Readonly<Ref<string>>) {
  const catalogo = cargarCatalogo()
  const consulta = shallowRef('')
  const categoria = shallowRef<Categoria | null>(null)
  const recientes = shallowRef<string[]>(leerBusquedasRecientes(usuario.value))

  const coincidencias = computed(() => buscar(catalogo, consulta.value, null))
  const resultados = computed(() =>
    categoria.value ? coincidencias.value.filter((p) => p.categoria === categoria.value) : coincidencias.value,
  )
  const conteoPorCategoria = computed(() => {
    const conteo: Partial<Record<Categoria, number>> = {}
    for (const p of coincidencias.value) conteo[p.categoria] = (conteo[p.categoria] ?? 0) + 1
    return conteo
  })
  const hayFiltros = computed(() => consulta.value.trim() !== '' || categoria.value !== null)

  // Solo se guarda como "reciente" lo que el usuario dejó de teclear un momento y dio resultados.
  watch(consulta, (valor, _anterior, onCleanup) => {
    if (resultados.value.length === 0) return
    const temporizador = setTimeout(() => {
      recientes.value = registrarBusqueda(usuario.value, valor)
    }, ESPERA_REGISTRO_MS)
    onCleanup(() => clearTimeout(temporizador))
  })

  function limpiarFiltros() {
    consulta.value = ''
    categoria.value = null
  }

  function olvidarRecientes() {
    borrarBusquedasRecientes(usuario.value)
    recientes.value = []
  }

  return {
    proyectos: catalogo.proyectos,
    consulta,
    categoria,
    resultados,
    conteoPorCategoria,
    hayFiltros,
    recientes,
    limpiarFiltros,
    olvidarRecientes,
  }
}
