import type { Resultado } from './bm25.ts'

/**
 * Fusión de rankings por Reciprocal Rank Fusion: cada lista aporta
 * 1 / (k + posición) y se suman. No requiere que los puntajes de BM25 y del
 * coseno sean comparables, por eso es la forma habitual de combinar búsqueda
 * léxica y semántica.
 */
export function fusionarRRF(listas: Resultado[][], k = 60): Resultado[] {
  const puntajes = new Map<string, number>()
  for (const lista of listas) {
    lista.forEach((r, posicion) => {
      puntajes.set(r.id, (puntajes.get(r.id) ?? 0) + 1 / (k + posicion + 1))
    })
  }
  return [...puntajes.entries()]
    .map(([id, puntaje]) => ({ id, puntaje }))
    .sort((a, b) => b.puntaje - a.puntaje)
}
