import type { Resultado } from './bm25.ts'

/**
 * Búsqueda semántica por similitud de coseno. Los vectores del corpus vienen
 * precalculados y cuantizados a Int8 (public/corpus/embeddings.json); solo la
 * pregunta se embebe en tiempo real.
 */

export interface ArchivoEmbeddings {
  meta: { modelo: string; dimensiones: number; cuantizacion: string; hashCorpus: string; generado: string; total: number }
  ids: string[]
  escalas: number[]
  valores: number[][]
}

export interface EmbeddingsCuantizados {
  meta: ArchivoEmbeddings['meta']
  ids: string[]
  /** Vectores ya reconstruidos y normalizados (norma 1). */
  vectores: Float32Array[]
}

export function cargarVectores(archivo: ArchivoEmbeddings): EmbeddingsCuantizados {
  const vectores = archivo.valores.map((valores, i) => {
    const escala = archivo.escalas[i] ?? 1
    const v = new Float32Array(valores.length)
    let norma = 0
    for (let j = 0; j < valores.length; j++) {
      v[j] = (valores[j] ?? 0) * escala
      norma += v[j]! * v[j]!
    }
    norma = Math.sqrt(norma) || 1
    for (let j = 0; j < v.length; j++) v[j] = v[j]! / norma
    return v
  })
  return { meta: archivo.meta, ids: archivo.ids, vectores }
}

export function normalizarVector(vector: number[]): Float32Array {
  const norma = Math.hypot(...vector) || 1
  return Float32Array.from(vector, (x) => x / norma)
}

export function buscarVectorial(embeddings: EmbeddingsCuantizados, consulta: number[], k = 10): Resultado[] {
  if (consulta.length !== embeddings.meta.dimensiones) {
    throw new Error(`El vector de consulta tiene ${consulta.length} dimensiones; el corpus usa ${embeddings.meta.dimensiones}.`)
  }
  const q = normalizarVector(consulta)
  const resultados: Resultado[] = embeddings.vectores.map((v, i) => {
    let producto = 0
    for (let j = 0; j < q.length; j++) producto += q[j]! * v[j]!
    return { id: embeddings.ids[i]!, puntaje: producto }
  })
  return resultados.sort((a, b) => b.puntaje - a.puntaje).slice(0, k)
}
