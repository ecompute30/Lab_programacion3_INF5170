import { Recuperador, type UnidadCorpus } from './recuperacion/recuperar.ts'
import { cargarVectores, type ArchivoEmbeddings, type EmbeddingsCuantizados } from './recuperacion/vectorial.ts'

/** Carga perezosa (una sola vez) del Estatuto procesado y de sus embeddings. */

export interface Capitulo {
  numero: number
  romano: string
  titulo: string
  pagina: number
}

export interface Articulo {
  numero: number
  capitulo: number
  seccion: string | null
  pagina: number
  parrafos: string[]
}

export interface EntradaGlosario {
  orden: number
  termino: string
  pagina: number
  texto: string
}

export interface Corpus {
  meta: { fuente: string; edicion: string; generado: string; totalPaginas: number; totalArticulos: number; totalUnidades: number; hash: string }
  capitulos: Capitulo[]
  articulos: Articulo[]
  glosario: EntradaGlosario[]
  unidades: UnidadCorpus[]
}

export interface CorpusCargado {
  corpus: Corpus
  recuperador: Recuperador
  embeddings: EmbeddingsCuantizados | null
  avisoEmbeddings: string | null
  articuloPorNumero: Map<number, Articulo>
  capituloPorNumero: Map<number, Capitulo>
}

const BASE = import.meta.env.BASE_URL

let carga: Promise<CorpusCargado> | null = null

export function cargarCorpus(): Promise<CorpusCargado> {
  carga ??= (async () => {
    const respuesta = await fetch(`${BASE}corpus/estatuto.json`)
    if (!respuesta.ok) throw new Error(`No se pudo cargar el Estatuto procesado (${respuesta.status}).`)
    const corpus = (await respuesta.json()) as Corpus

    let embeddings: EmbeddingsCuantizados | null = null
    let avisoEmbeddings: string | null = null
    try {
      const r = await fetch(`${BASE}corpus/embeddings.json`)
      // Un servidor SPA puede devolver index.html (200) para rutas inexistentes: se exige JSON.
      if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
        const archivo = (await r.json()) as ArchivoEmbeddings
        if (archivo.meta.hashCorpus !== corpus.meta.hash) {
          avisoEmbeddings = 'Los embeddings corresponden a otra versión del corpus; se usará solo búsqueda léxica.'
        } else {
          embeddings = cargarVectores(archivo)
        }
      } else {
        avisoEmbeddings = 'No hay embeddings generados; se usará solo búsqueda léxica (BM25).'
      }
    } catch {
      avisoEmbeddings = 'No se pudieron leer los embeddings; se usará solo búsqueda léxica (BM25).'
    }

    return {
      corpus,
      recuperador: new Recuperador(corpus.unidades, embeddings),
      embeddings,
      avisoEmbeddings,
      articuloPorNumero: new Map(corpus.articulos.map((a) => [a.numero, a])),
      capituloPorNumero: new Map(corpus.capitulos.map((c) => [c.numero, c])),
    }
  })().catch((error) => {
    carga = null
    throw error
  })
  return carga
}

export function urlPaginaPdf(pagina: number) {
  return `${BASE}docs/ESTATUTO-ORGANICO-UASD.pdf#page=${pagina}`
}
