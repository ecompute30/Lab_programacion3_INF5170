import { buscarBM25, construirIndice, type IndiceBM25, type Resultado } from './bm25.ts'
import { fusionarRRF } from './hibrida.ts'
import { buscarVectorial, type EmbeddingsCuantizados } from './vectorial.ts'
import { normalizar, tokenizar } from './normalizar.ts'
import type { FragmentoContexto } from '../llm/tipos.ts'

/**
 * Orquesta la recuperación: BM25 siempre; búsqueda vectorial cuando hay
 * embeddings y una función para embeber la consulta; fusión RRF; penalización
 * del glosario (entradas cortas que BM25 favorece de más); agrupación por
 * artículo y recorte al presupuesto de tokens del contexto.
 */

export interface UnidadCorpus {
  id: string
  tipo: 'articulo' | 'glosario'
  articulo: number | null
  parte: number
  partes: number
  encabezado: string
  texto: string
}

export interface OpcionesRecuperacion {
  embeberConsulta?: (texto: string) => Promise<number[]>
  /** Pregunta anterior del usuario, para dar contexto a preguntas de seguimiento cortas. */
  preguntaAnterior?: string
  maxFragmentos?: number
  maxTokens?: number
  candidatos?: number
  /** Peso del ranking vectorial frente al léxico en la fusión (1 = iguales). */
  pesoVectorial?: number
  /** Constante k de la fusión RRF: cuanto menor, más pesa el primer puesto de cada lista. */
  kRRF?: number
}

export interface TrazaRecuperacion {
  consultaEfectiva: string
  bm25: Resultado[]
  vectorial: Resultado[] | null
  fusion: Resultado[]
  usoVectorial: boolean
  errorVectorial?: string
}

export interface ResultadoRecuperacion {
  fragmentos: FragmentoContexto[]
  traza: TrazaRecuperacion
}

const FACTOR_GLOSARIO = 0.6
const PESO_VECTORIAL_POR_DEFECTO = 1
// Con solo dos listas, k = 10 (en vez del clásico 60) evita que un artículo #1 en una lista pierda
// contra artículos mediocres presentes en ambas; 40 candidatos aumentan el solapamiento entre listas.
const K_RRF_POR_DEFECTO = 10
const CANDIDATOS_POR_DEFECTO = 40
const PALABRAS_SEGUIMIENTO = 6

const tokensAprox = (texto: string) => Math.ceil(texto.length / 3.6)

export class Recuperador {
  private readonly indice: IndiceBM25
  private readonly porId: Map<string, UnidadCorpus>
  private readonly unidades: UnidadCorpus[]
  private readonly embeddings: EmbeddingsCuantizados | null

  constructor(unidades: UnidadCorpus[], embeddings: EmbeddingsCuantizados | null = null) {
    this.unidades = unidades
    this.embeddings = embeddings
    this.indice = construirIndice(unidades)
    this.porId = new Map(unidades.map((u) => [u.id, u]))
  }

  get tieneEmbeddings() {
    return this.embeddings !== null
  }

  async recuperar(consulta: string, opciones: OpcionesRecuperacion = {}): Promise<ResultadoRecuperacion> {
    const { maxFragmentos = 8, maxTokens = 3500, candidatos = CANDIDATOS_POR_DEFECTO, pesoVectorial = PESO_VECTORIAL_POR_DEFECTO, kRRF = K_RRF_POR_DEFECTO } = opciones
    const consultaEfectiva = this.ampliarSeguimiento(consulta, opciones.preguntaAnterior)

    const bm25 = this.penalizarGlosario(buscarBM25(this.indice, consultaEfectiva, candidatos))

    let vectorial: Resultado[] | null = null
    let errorVectorial: string | undefined
    if (this.embeddings && opciones.embeberConsulta) {
      try {
        const vector = await opciones.embeberConsulta(consultaEfectiva)
        vectorial = this.penalizarGlosario(buscarVectorial(this.embeddings, vector, candidatos))
      } catch (error) {
        errorVectorial = error instanceof Error ? error.message : String(error)
      }
    }

    const fusion = this.promoverDefiniciones(consulta, vectorial ? fusionarRRF([bm25, vectorial], kRRF, [1, pesoVectorial]) : bm25)
    const fragmentos = this.seleccionar(fusion, maxFragmentos, maxTokens)

    return {
      fragmentos,
      traza: { consultaEfectiva, bm25, vectorial, fusion, usoVectorial: vectorial !== null, errorVectorial },
    }
  }

  /** "¿Y sus deberes?" solo tiene sentido junto a la pregunta anterior. */
  private ampliarSeguimiento(consulta: string, anterior?: string) {
    const palabras = consulta.trim().split(/\s+/).length
    return anterior && palabras <= PALABRAS_SEGUIMIENTO ? `${consulta} ${anterior}` : consulta
  }

  /**
   * "¿Qué son las Facultades?" se responde mejor con el artículo que empieza
   * definiéndolas ("Las Facultades son…") que con los que solo las mencionan.
   */
  private promoverDefiniciones(consulta: string, resultados: Resultado[]): Resultado[] {
    const m = normalizar(consulta).match(/^[¿?\s]*(?:que|cual)\s+(?:es|son)\s+(?:el|la|los|las|un|una)?\s*([a-z0-9ñ ]{3,60}?)[?\s]*$/)
    if (!m) return resultados
    const sujeto = tokenizar(m[1]!).join(' ')
    if (!sujeto) return resultados
    const define = (id: string) => {
      const texto = this.porId.get(id)?.texto ?? ''
      const inicio = tokenizar(texto.slice(0, 120)).slice(0, sujeto.split(' ').length + 2).join(' ')
      return inicio.startsWith(sujeto) && /^(el|la|los|las)\s+[^.]{2,80}?\s+(es|son)\s/i.test(normalizar(texto))
    }
    const definitorios = resultados.filter((r) => define(r.id))
    if (definitorios.length === 0) return resultados
    return [...definitorios, ...resultados.filter((r) => !definitorios.includes(r))]
  }

  private penalizarGlosario(resultados: Resultado[]): Resultado[] {
    return resultados
      .map((r) => (this.porId.get(r.id)?.tipo === 'glosario' ? { ...r, puntaje: r.puntaje * FACTOR_GLOSARIO } : r))
      .sort((a, b) => b.puntaje - a.puntaje)
  }

  /** Mantiene el orden de relevancia, evita repetir artículo salvo partes distintas y respeta el presupuesto. */
  private seleccionar(ordenados: Resultado[], maxFragmentos: number, maxTokens: number): FragmentoContexto[] {
    const elegidos: FragmentoContexto[] = []
    let tokens = 0
    for (const r of ordenados) {
      const unidad = this.porId.get(r.id)
      if (!unidad) continue
      const costo = tokensAprox(unidad.texto)
      if (elegidos.length >= maxFragmentos || tokens + costo > maxTokens) break
      elegidos.push({ id: unidad.id, articulo: unidad.articulo, encabezado: unidad.encabezado, texto: unidad.texto, puntaje: r.puntaje })
      tokens += costo
    }
    // Las partes de un mismo artículo se presentan en orden de lectura.
    return elegidos.sort((a, b) => {
      if (a.articulo !== null && a.articulo === b.articulo) return a.id.localeCompare(b.id, undefined, { numeric: true })
      return 0
    })
  }

  unidad(id: string) {
    return this.porId.get(id)
  }

  get totalUnidades() {
    return this.unidades.length
  }
}
