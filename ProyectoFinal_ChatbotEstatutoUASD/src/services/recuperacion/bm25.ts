import { tokenizar } from './normalizar.ts'

/**
 * BM25 clásico (Robertson/Spärck Jones) sobre las unidades del corpus. El
 * encabezado (número de artículo, capítulo, sección) se indexa con más peso
 * que el cuerpo porque concentra los términos que la gente usa al preguntar.
 */

export interface DocumentoIndexable {
  id: string
  encabezado: string
  texto: string
}

export interface Resultado {
  id: string
  puntaje: number
}

interface Postings {
  /** id de documento -> frecuencia del término */
  frecuencias: Map<string, number>
}

export interface IndiceBM25 {
  terminos: Map<string, Postings>
  longitudes: Map<string, number>
  longitudMedia: number
  totalDocumentos: number
}

const K1 = 1.5
const B = 0.75
const PESO_ENCABEZADO = 2

export function construirIndice(documentos: DocumentoIndexable[]): IndiceBM25 {
  const terminos = new Map<string, Postings>()
  const longitudes = new Map<string, number>()
  let sumaLongitudes = 0

  for (const doc of documentos) {
    const tokens = [
      ...Array<string[]>(PESO_ENCABEZADO).fill(tokenizar(doc.encabezado)).flat(),
      ...tokenizar(doc.texto),
    ]
    longitudes.set(doc.id, tokens.length)
    sumaLongitudes += tokens.length
    for (const token of tokens) {
      let postings = terminos.get(token)
      if (!postings) terminos.set(token, (postings = { frecuencias: new Map() }))
      postings.frecuencias.set(doc.id, (postings.frecuencias.get(doc.id) ?? 0) + 1)
    }
  }

  return { terminos, longitudes, longitudMedia: sumaLongitudes / Math.max(documentos.length, 1), totalDocumentos: documentos.length }
}

export function buscarBM25(indice: IndiceBM25, consulta: string, k = 10): Resultado[] {
  const puntajes = new Map<string, number>()
  for (const token of new Set(tokenizar(consulta))) {
    const postings = indice.terminos.get(token)
    if (!postings) continue
    const df = postings.frecuencias.size
    const idf = Math.log(1 + (indice.totalDocumentos - df + 0.5) / (df + 0.5))
    for (const [id, tf] of postings.frecuencias) {
      const longitud = indice.longitudes.get(id) ?? indice.longitudMedia
      const normalizacion = K1 * (1 - B + (B * longitud) / indice.longitudMedia)
      const aporte = idf * ((tf * (K1 + 1)) / (tf + normalizacion))
      puntajes.set(id, (puntajes.get(id) ?? 0) + aporte)
    }
  }
  return [...puntajes.entries()]
    .map(([id, puntaje]) => ({ id, puntaje }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, k)
}
