import { PROYECTOS, NOMBRES_CATEGORIA, VERSION_CATALOGO } from '../data/proyectos'
import type { Categoria, Proyecto } from '../types/proyecto'

/**
 * Catálogo de proyectos e índice de búsqueda persistidos en localStorage.
 * El índice se construye una vez por versión del catálogo: cada proyecto
 * guarda sus términos normalizados (sin tildes, en minúsculas) con un peso
 * según el campo donde aparecen, para ordenar los resultados por relevancia.
 */

interface EntradaIndice {
  id: string
  /** término -> peso (título 5, práctica/tecnología 3, categoría 2, resumen 1) */
  terminos: Record<string, number>
}

interface CatalogoAlmacenado {
  version: number
  proyectos: Proyecto[]
  indice: EntradaIndice[]
}

const CLAVE_CATALOGO = 'portafolio.catalogo'
const CLAVE_RECIENTES = 'portafolio.busquedas-recientes'
const MAX_RECIENTES = 5

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter(Boolean)
}

function indexar(proyecto: Proyecto): EntradaIndice {
  const terminos: Record<string, number> = {}
  const agregar = (texto: string, peso: number) => {
    for (const termino of tokenizar(texto)) terminos[termino] = Math.max(terminos[termino] ?? 0, peso)
  }
  agregar(proyecto.resumen, 1)
  agregar(NOMBRES_CATEGORIA[proyecto.categoria], 2)
  agregar(proyecto.tecnologias.join(' '), 3)
  agregar(`practica ${proyecto.practica} p${proyecto.practica}`, 3)
  agregar(proyecto.titulo, 5)
  return { id: proyecto.id, terminos }
}

function construirCatalogo(): CatalogoAlmacenado {
  const catalogo = { version: VERSION_CATALOGO, proyectos: PROYECTOS, indice: PROYECTOS.map(indexar) }
  localStorage.setItem(CLAVE_CATALOGO, JSON.stringify(catalogo))
  return catalogo
}

export function cargarCatalogo(): CatalogoAlmacenado {
  try {
    const crudo = localStorage.getItem(CLAVE_CATALOGO)
    if (crudo) {
      const catalogo = JSON.parse(crudo) as CatalogoAlmacenado
      if (catalogo.version === VERSION_CATALOGO) return catalogo
    }
  } catch {
    // Catálogo corrupto: se reconstruye abajo.
  }
  return construirCatalogo()
}

/**
 * Cada término de la consulta debe coincidir (como prefijo) con algún término
 * indexado; el puntaje suma el mejor peso encontrado para cada uno.
 */
export function buscar(
  catalogo: CatalogoAlmacenado,
  consulta: string,
  categoria: Categoria | null,
): Proyecto[] {
  const terminosConsulta = tokenizar(consulta)
  const porId = new Map(catalogo.proyectos.map((p) => [p.id, p]))

  const resultados: Array<{ proyecto: Proyecto; puntaje: number; orden: number }> = []
  catalogo.indice.forEach((entrada, orden) => {
    const proyecto = porId.get(entrada.id)
    if (!proyecto || (categoria && proyecto.categoria !== categoria)) return

    let puntaje = 0
    for (const termino of terminosConsulta) {
      let mejor = 0
      for (const [indexado, peso] of Object.entries(entrada.terminos)) {
        if (indexado.startsWith(termino)) mejor = Math.max(mejor, indexado === termino ? peso + 1 : peso)
      }
      if (mejor === 0) return
      puntaje += mejor
    }
    resultados.push({ proyecto, puntaje, orden })
  })

  return resultados
    .sort((a, b) => b.puntaje - a.puntaje || a.orden - b.orden)
    .map((r) => r.proyecto)
}

function claveRecientes(usuario: string) {
  return `${CLAVE_RECIENTES}.${usuario}`
}

export function leerBusquedasRecientes(usuario: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(claveRecientes(usuario)) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function registrarBusqueda(usuario: string, consulta: string): string[] {
  const limpia = consulta.trim()
  const actuales = leerBusquedasRecientes(usuario)
  if (limpia.length < 2) return actuales
  const recientes = [limpia, ...actuales.filter((r) => normalizar(r) !== normalizar(limpia))].slice(0, MAX_RECIENTES)
  localStorage.setItem(claveRecientes(usuario), JSON.stringify(recientes))
  return recientes
}

export function borrarBusquedasRecientes(usuario: string) {
  localStorage.removeItem(claveRecientes(usuario))
}
