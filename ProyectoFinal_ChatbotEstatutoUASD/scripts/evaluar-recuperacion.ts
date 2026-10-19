/**
 * Evalúa la recuperación con las 35 preguntas sugeridas: ¿aparece algún
 * artículo de los capítulos esperados entre los K primeros resultados?
 * Corre en Node sin build: `npm run evaluar` (usa --experimental-strip-types).
 * Con embeddings.json presente y GEMINI_API_KEY en .env, evalúa también la
 * búsqueda vectorial y la híbrida; si no, solo BM25.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cargarVectores, type EmbeddingsCuantizados } from '../src/services/recuperacion/vectorial.ts'
import { Recuperador, type UnidadCorpus } from '../src/services/recuperacion/recuperar.ts'
import { PREGUNTAS_SUGERIDAS } from '../src/data/preguntasSugeridas.ts'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const K = Number(process.env.K ?? 5)
const PESO_VECTORIAL = process.env.PESO_VECTORIAL ? Number(process.env.PESO_VECTORIAL) : undefined
const K_RRF = process.env.K_RRF ? Number(process.env.K_RRF) : undefined
const CANDIDATOS = process.env.CANDIDATOS ? Number(process.env.CANDIDATOS) : undefined
const DETALLE = process.argv.includes('--detalle')
// Los embeddings de las 35 consultas se guardan en caché para poder repetir la evaluación sin gastar cuota.
const RUTA_CACHE = path.join(RAIZ, 'node_modules/.cache/consultas-embebidas.json')

interface Articulo { numero: number; capitulo: number }

const corpus = JSON.parse(await readFile(path.join(RAIZ, 'public/corpus/estatuto.json'), 'utf8')) as { unidades: UnidadCorpus[]; articulos: Articulo[] }
const capituloDeArticulo = new Map(corpus.articulos.map((a) => [a.numero, a.capitulo]))
const unidadPorId = new Map(corpus.unidades.map((u) => [u.id, u]))

const rutaEmbeddings = path.join(RAIZ, 'public/corpus/embeddings.json')
let vectores: EmbeddingsCuantizados | null = null
let embeberConsulta: ((texto: string) => Promise<number[]>) | null = null
if (existsSync(rutaEmbeddings) && process.env.GEMINI_API_KEY) {
  vectores = cargarVectores(JSON.parse(await readFile(rutaEmbeddings, 'utf8')))
  const modelo = vectores.meta.modelo
  const cache: Record<string, number[]> = existsSync(RUTA_CACHE) ? JSON.parse(await readFile(RUTA_CACHE, 'utf8')) : {}
  const claveCache = (texto: string) => `${modelo}:${vectores!.meta.dimensiones}:${texto}`
  embeberConsulta = async (texto) => {
    const enCache = cache[claveCache(texto)]
    if (enCache) return enCache
    const respuesta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        model: `models/${modelo}`,
        content: { parts: [{ text: `task: question answering | query: ${texto}` }] },
        outputDimensionality: vectores!.meta.dimensiones,
      }),
    })
    if (!respuesta.ok) throw new Error(`embedContent ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`)
    const vector = ((await respuesta.json()) as { embedding: { values: number[] } }).embedding.values
    cache[claveCache(texto)] = vector
    await mkdir(path.dirname(RUTA_CACHE), { recursive: true })
    await writeFile(RUTA_CACHE, JSON.stringify(cache))
    return vector
  }
}

function capitulosDe(ids: string[]): number[] {
  return ids.map((id) => unidadPorId.get(id)?.articulo).map((n) => (n ? capituloDeArticulo.get(n) ?? -1 : -1))
}

function acierta(ids: string[], esperados: number[]) {
  return capitulosDe(ids.slice(0, K)).some((c) => esperados.includes(c))
}

const resumen: Record<string, { aciertos: number; fallos: string[] }> = {}
const registrar = (modo: string, pregunta: string, ids: string[], esperados: number[]) => {
  resumen[modo] ??= { aciertos: 0, fallos: [] }
  if (acierta(ids, esperados)) resumen[modo].aciertos++
  else resumen[modo].fallos.push(`${pregunta}  →  top${K}: ${ids.slice(0, K).map((id) => `${id}(c${capitulosDe([id])[0]})`).join(' ')}  esperado: c${esperados.join('/')}`)
  if (DETALLE) console.log(`[${modo}] ${pregunta}\n   ${ids.slice(0, K).map((id) => `${id} (cap ${capitulosDe([id])[0]})`).join(' · ')}`)
}

const soloBM25 = new Recuperador(corpus.unidades, null)
const hibrido = vectores ? new Recuperador(corpus.unidades, vectores) : null

for (const { texto, capitulosEsperados } of PREGUNTAS_SUGERIDAS) {
  const { fragmentos: fBm25 } = await soloBM25.recuperar(texto)
  registrar('bm25', texto, fBm25.map((f) => f.id), capitulosEsperados)
  if (hibrido && embeberConsulta) {
    const { fragmentos, traza } = await hibrido.recuperar(texto, { embeberConsulta, pesoVectorial: PESO_VECTORIAL, kRRF: K_RRF, candidatos: CANDIDATOS })
    if (traza.errorVectorial) console.warn('  vectorial falló:', traza.errorVectorial)
    registrar('vectorial', texto, (traza.vectorial ?? []).map((r) => r.id), capitulosEsperados)
    registrar('hibrida', texto, fragmentos.map((f) => f.id), capitulosEsperados)
    if (!existsSync(RUTA_CACHE)) await new Promise((r) => setTimeout(r, 700))
  }
}

console.log(`\nAcierto@${K} sobre ${PREGUNTAS_SUGERIDAS.length} preguntas (peso vectorial ${PESO_VECTORIAL ?? 'defecto'}, k ${K_RRF ?? 'defecto'}, candidatos ${CANDIDATOS ?? 'defecto'}):`)
for (const [modo, { aciertos, fallos }] of Object.entries(resumen)) {
  console.log(`  ${modo.padEnd(10)} ${aciertos}/${PREGUNTAS_SUGERIDAS.length}  (${((100 * aciertos) / PREGUNTAS_SUGERIDAS.length).toFixed(0)} %)`)
  for (const f of fallos) console.log(`     ✗ ${f}`)
}
if (!vectores) console.log('\n(Sin embeddings.json o sin GEMINI_API_KEY: solo se evaluó BM25.)')
