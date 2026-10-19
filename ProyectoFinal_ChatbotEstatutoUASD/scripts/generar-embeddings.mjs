/**
 * Calcula una vez los embeddings de las unidades del corpus con Gemini y los
 * guarda cuantizados (Int8) en public/corpus/embeddings.json. Requiere
 * GEMINI_API_KEY (desde .env, solo en build): `npm run embeddings`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RUTA_CORPUS = path.join(RAIZ, 'public/corpus/estatuto.json')
const RUTA_SALIDA = path.join(RAIZ, 'public/corpus/embeddings.json')

const CLAVE = process.env.GEMINI_API_KEY
const MODELO = process.env.GEMINI_MODELO_EMBEDDINGS ?? 'gemini-embedding-2'
const DIMENSIONES = Number(process.env.GEMINI_EMBEDDING_DIMS ?? 768)
const TAMANO_LOTE = 20
const PAUSA_MS = 1500

if (!CLAVE) {
  console.error('Falta GEMINI_API_KEY. Copia .env.example a .env y coloca tu clave (solo se usa en este script).')
  process.exit(1)
}

const corpus = JSON.parse(await readFile(RUTA_CORPUS, 'utf8'))
const unidades = corpus.unidades

// gemini-embedding-2 no acepta taskType: el rol se indica con un prefijo en el texto.
const textoDocumento = (u) => `title: ${u.encabezado} | text: ${u.texto}`

async function embeberLote(lote) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:batchEmbedContents`
  const cuerpo = {
    requests: lote.map((u) => ({
      model: `models/${MODELO}`,
      content: { parts: [{ text: textoDocumento(u) }] },
      outputDimensionality: DIMENSIONES,
    })),
  }
  for (let intento = 1; intento <= 5; intento++) {
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CLAVE },
      body: JSON.stringify(cuerpo),
    })
    if (respuesta.ok) {
      const datos = await respuesta.json()
      return datos.embeddings.map((e) => e.values)
    }
    const detalle = await respuesta.text()
    if (respuesta.status === 429 || respuesta.status >= 500) {
      const espera = intento * 10_000
      console.warn(`  ${respuesta.status} en el lote; reintento ${intento}/5 en ${espera / 1000}s`)
      await new Promise((r) => setTimeout(r, espera))
      continue
    }
    throw new Error(`Gemini ${respuesta.status}: ${detalle.slice(0, 300)}`)
  }
  throw new Error('Se agotaron los reintentos del lote.')
}

/** Int8 con escala por vector: conserva el ranking por coseno con ~1/4 del tamaño. */
function cuantizar(vector) {
  const norma = Math.hypot(...vector) || 1
  const normalizado = vector.map((v) => v / norma)
  const escala = Math.max(...normalizado.map(Math.abs)) / 127 || 1
  return { escala, valores: normalizado.map((v) => Math.round(v / escala)) }
}

console.log(`Embeddings de ${unidades.length} unidades con ${MODELO} (${DIMENSIONES} dims), lotes de ${TAMANO_LOTE}…`)
const vectores = []
for (let i = 0; i < unidades.length; i += TAMANO_LOTE) {
  const lote = unidades.slice(i, i + TAMANO_LOTE)
  const resultado = await embeberLote(lote)
  vectores.push(...resultado.map(cuantizar))
  console.log(`  ${Math.min(i + TAMANO_LOTE, unidades.length)}/${unidades.length}`)
  if (i + TAMANO_LOTE < unidades.length) await new Promise((r) => setTimeout(r, PAUSA_MS))
}

const salida = {
  meta: {
    modelo: MODELO,
    dimensiones: DIMENSIONES,
    cuantizacion: 'int8-escala-por-vector',
    hashCorpus: corpus.meta.hash,
    generado: new Date().toISOString(),
    total: vectores.length,
  },
  ids: unidades.map((u) => u.id),
  escalas: vectores.map((v) => Number(v.escala.toPrecision(6))),
  valores: vectores.map((v) => v.valores),
}
await writeFile(RUTA_SALIDA, JSON.stringify(salida), 'utf8')
const kb = (Buffer.byteLength(JSON.stringify(salida)) / 1024).toFixed(0)
console.log(`Escrito ${path.relative(RAIZ, RUTA_SALIDA)} (${kb} KB)`)
