/**
 * Convierte el PDF oficial del Estatuto Orgánico en public/corpus/estatuto.json:
 * capítulos, artículos (con página, sección y párrafos) y glosario, más las
 * "unidades" de recuperación (artículos largos subdivididos) que indexan BM25
 * y los embeddings. Se ejecuta una vez en build: `npm run corpus`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RUTA_PDF = path.join(RAIZ, 'public/docs/ESTATUTO-ORGANICO-UASD.pdf')
const RUTA_SALIDA = path.join(RAIZ, 'public/corpus/estatuto.json')
const URL_OFICIAL = 'https://postgrado.uasd.edu.do/wp-content/uploads/2024/06/ESTATUTO-ORGANICO-UASD.pdf'
const MAX_TOKENS_UNIDAD = 450
const DEPURAR = process.argv.includes('--debug')

const tokensAprox = (texto) => Math.ceil(texto.length / 3.6)

/* ---------- 1. Extracción de líneas por página ---------- */

async function extraerLineas() {
  const datos = new Uint8Array(await readFile(RUTA_PDF))
  const doc = await pdfjs.getDocument({ data: datos, useSystemFonts: true, isEvalSupported: false }).promise
  const lineas = []
  for (let p = 1; p <= doc.numPages; p++) {
    const pagina = await doc.getPage(p)
    const contenido = await pagina.getTextContent()
    let actual = ''
    for (const item of contenido.items) {
      if (!('str' in item)) continue
      actual += item.str
      if (item.hasEOL) {
        lineas.push({ pagina: p, texto: actual })
        actual = ''
      }
    }
    if (actual.trim()) lineas.push({ pagina: p, texto: actual })
  }
  return { lineas, totalPaginas: doc.numPages }
}

/* ---------- 2. Limpieza ---------- */

const ES_ENCABEZADO = [
  /^\s*Aprobado por el Claustro Mayor\s+\d+\s*$/,
  /^\s*\d+\s+Estatuto Org[aá]nico\s*$/,
  /^\s*\d+\s+Glosario Aprobado\s*$/,
  /^\s*Glosario Aprobado\s+\d+\s*$/,
  /^\s*\d{1,3}\s*$/,
]

// En el glosario el encabezado de página a veces queda pegado dentro de una palabra partida.
const ENCABEZADOS_PEGADOS = [/por el Consejo Universitario\s+\d{2,3}(?!\d)\s*/g, /\b\d{2,3}\s+Glosario Aprobado\s*/g]

function limpiar(lineas) {
  return lineas
    .map((l) => {
      let texto = l.texto.replace(/­/g, '')
      if (l.pagina >= 95) for (const re of ENCABEZADOS_PEGADOS) texto = texto.replace(re, '')
      return { pagina: l.pagina, texto: texto.replace(/[ \t]+/g, ' ').trim() }
    })
    .filter((l) => !ES_ENCABEZADO.some((re) => re.test(l.texto)))
}

/* ---------- 3. Segmentación ---------- */

// "CAPÍTULO VI" en el cuerpo; dos capítulos aparecen como "Capítulo VII:" (mixto y con dos puntos).
const RE_CAPITULO = /^Cap[ií]tulo\s+([IVXLC]+|\d+)\b:?\s*([^.]*)$/i
// Un título de capítulo partido en dos líneas termina en conjunción, preposición, artículo o coma.
const RE_TITULO_INCOMPLETO = /(,|\b(?:y|e|o|u|de|del|la|las|los|el|al|a|en|para|por|con|sobre))\s*$/i
const RE_ARTICULO = /^ART[IÍ]CULO\s+(\d+)\s*$/
const RE_SECCION = /^(?:De|Del|De la|De los|De las|Disposiciones)\b[^.]{3,80}$/
const RE_PARRAFO = /^P[ÁA]RRAFO(?:\s+[IVXLC\d]+)?\b/
const RE_INCISO = /^(?:[a-zñ]\)|\d{1,2}\.)\s/

function aRomano(n) {
  const tabla = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let r = ''
  for (const [v, s] of tabla) while (n >= v) { r += s; n -= v }
  return r
}

function deRomano(s) {
  if (/^\d+$/.test(s)) return Number(s)
  const val = { I: 1, V: 5, X: 10, L: 50, C: 100 }
  let total = 0
  for (let i = 0; i < s.length; i++) {
    const v = val[s[i]]
    const sig = val[s[i + 1]] ?? 0
    total += v < sig ? -v : v
  }
  return total
}

/** Une líneas en párrafos: respeta Párrafos/incisos y repara palabras partidas con guion. */
function lineasAParrafos(lineas) {
  const parrafos = []
  let actual = ''
  const cerrar = () => { if (actual.trim()) parrafos.push(actual.trim()); actual = '' }
  for (const linea of lineas) {
    if (!linea) { cerrar(); continue }
    const iniciaBloque = RE_PARRAFO.test(linea) || RE_INCISO.test(linea)
    const anteriorCerro = /[.:;]$/.test(actual.trim()) && /^[A-ZÁÉÍÓÚÑ"“(]/.test(linea)
    if (iniciaBloque || anteriorCerro) cerrar()
    if (/[A-Za-zÁÉÍÓÚáéíóúñ] ?-$/.test(actual) && /^[a-záéíóúñ]/.test(linea)) {
      actual = actual.replace(/ ?-$/, '') + linea
    } else {
      actual += (actual ? ' ' : '') + linea
    }
  }
  cerrar()
  return parrafos
}

function segmentar(lineas) {
  const primerArticulo = lineas.findIndex((l) => RE_ARTICULO.test(l.texto) && Number(l.texto.match(RE_ARTICULO)[1]) === 1)
  let inicio = primerArticulo
  while (inicio > 0 && !RE_CAPITULO.test(lineas[inicio].texto)) inicio--
  const indiceGlosario = lineas.findIndex((l, i) => i > primerArticulo && /^GLOSARIO$/.test(l.texto))

  const capitulos = []
  const articulos = []
  let capituloActual = null
  let seccionActual = null
  let articuloActual = null
  let pendientesTituloCapitulo = 0
  let finCuerpo = indiceGlosario === -1 ? lineas.length : indiceGlosario

  const cerrarArticulo = () => {
    if (!articuloActual) return
    // Una sección ("De los Vicerrectores") justo antes del siguiente artículo pertenece al siguiente.
    const lineasTexto = [...articuloActual.lineas]
    let nuevaSeccion = null
    const ultima = lineasTexto.at(-1)
    if (ultima && RE_SECCION.test(ultima) && lineasTexto.length > 1) {
      nuevaSeccion = lineasTexto.pop()
    }
    articuloActual.parrafos = lineasAParrafos(lineasTexto)
    delete articuloActual.lineas
    articulos.push(articuloActual)
    articuloActual = null
    if (nuevaSeccion) seccionActual = nuevaSeccion
  }

  for (let i = inicio; i < finCuerpo; i++) {
    const { texto, pagina } = lineas[i]
    const mCap = texto.match(RE_CAPITULO)
    if (mCap) {
      cerrarArticulo()
      capituloActual = { numero: deRomano(mCap[1]), romano: aRomano(deRomano(mCap[1])), titulo: mCap[2].trim(), pagina }
      capitulos.push(capituloActual)
      seccionActual = null
      pendientesTituloCapitulo = capituloActual.titulo ? 1 : 2
      continue
    }
    const mArt = texto.match(RE_ARTICULO)
    if (mArt) {
      cerrarArticulo()
      pendientesTituloCapitulo = 0
      articuloActual = {
        numero: Number(mArt[1]),
        capitulo: capituloActual?.numero ?? null,
        seccion: seccionActual,
        pagina,
        lineas: [],
      }
      continue
    }
    if (!texto) {
      if (articuloActual) articuloActual.lineas.push('')
      continue
    }
    if (pendientesTituloCapitulo > 0 && !articuloActual) {
      // Título del capítulo (hasta tres líneas) y, después, un subtítulo de sección. La línea
      // continúa el título si este quedó incompleto, si empieza en minúscula o si es muy corta.
      const continuaTitulo =
        pendientesTituloCapitulo === 2 ||
        RE_TITULO_INCOMPLETO.test(capituloActual.titulo) ||
        /^[a-záéíóúñ]/.test(texto) ||
        (texto.split(' ').length <= 3 && !/[.]$/.test(capituloActual.titulo) && capituloActual.titulo.length + texto.length < 90)
      if (continuaTitulo) {
        capituloActual.titulo = `${capituloActual.titulo} ${texto}`.trim()
        pendientesTituloCapitulo = 1
      } else {
        seccionActual = texto
        pendientesTituloCapitulo = 0
      }
      continue
    }
    if (!articuloActual) {
      if (RE_SECCION.test(texto)) seccionActual = texto
      continue
    }
    articuloActual.lineas.push(texto)
  }
  cerrarArticulo()

  // El último artículo arrastra la firma de cierre; se corta en "Aprobado por el Claustro Mayor en sus sesiones".
  const ultimo = articulos.at(-1)
  const corte = ultimo.parrafos.findIndex((p) => /^Aprobado por el Claustro Mayor en sus sesiones/.test(p))
  if (corte > 0) ultimo.parrafos = ultimo.parrafos.slice(0, corte)

  const glosario = indiceGlosario === -1 ? [] : segmentarGlosario(lineas.slice(indiceGlosario + 1))
  return { capitulos, articulos, glosario }
}

function segmentarGlosario(lineas) {
  // Entradas numeradas "12. Término:" seguidas de su definición; "A)" son separadores alfabéticos.
  const entradas = []
  let actual = null
  for (const { texto, pagina } of lineas) {
    if (!texto || /^[A-ZÑ]\)$/.test(texto)) continue
    if (/^Este Estatuto Orgánico de la Universidad Autónoma de Santo Domingo, con una tirada/.test(texto)) break
    // "15. Categorías de la Carrera Académica" viene sin dos puntos; se acepta si la línea es corta.
    const m = texto.match(/^(\d{1,3})\.\s+([A-ZÁÉÍÓÚÑ].{1,60}?)(?::\s*(.*)|)$/)
    const esEntrada = m && (m[3] !== undefined || texto.length <= 60) && (!actual || Number(m[1]) === actual.orden + 1)
    if (esEntrada) {
      if (actual) entradas.push(actual)
      actual = { orden: Number(m[1]), termino: m[2].trim(), pagina, lineas: m[3] ? [m[3]] : [] }
    } else if (actual) {
      actual.lineas.push(texto)
    }
  }
  if (actual) entradas.push(actual)
  return entradas
    .map((e) => ({ orden: e.orden, termino: e.termino, pagina: e.pagina, texto: lineasAParrafos(e.lineas).join(' ') }))
    .filter((e) => e.texto.length > 10)
}

/* ---------- 4. Unidades de recuperación ---------- */

function construirUnidades(articulos, capitulos, glosario) {
  const porCapitulo = new Map(capitulos.map((c) => [c.numero, c]))
  const unidades = []
  for (const art of articulos) {
    const cap = porCapitulo.get(art.capitulo)
    const encabezado = `Artículo ${art.numero}. Capítulo ${cap?.romano ?? '?'}: ${cap?.titulo ?? ''}${art.seccion ? `. ${art.seccion}` : ''}`
    const texto = art.parrafos.join('\n')
    if (tokensAprox(texto) <= MAX_TOKENS_UNIDAD || art.parrafos.length === 1) {
      unidades.push({ id: `art-${art.numero}`, tipo: 'articulo', articulo: art.numero, parte: 1, partes: 1, encabezado, texto })
      continue
    }
    const grupos = []
    let grupo = []
    let tokens = 0
    for (const p of art.parrafos) {
      const t = tokensAprox(p)
      if (grupo.length && tokens + t > MAX_TOKENS_UNIDAD) { grupos.push(grupo); grupo = []; tokens = 0 }
      grupo.push(p); tokens += t
    }
    if (grupo.length) grupos.push(grupo)
    grupos.forEach((g, i) => unidades.push({
      id: `art-${art.numero}-${i + 1}`, tipo: 'articulo', articulo: art.numero, parte: i + 1, partes: grupos.length, encabezado, texto: g.join('\n'),
    }))
  }
  glosario.forEach((g, i) => unidades.push({
    id: `glo-${i + 1}`, tipo: 'glosario', articulo: null, parte: 1, partes: 1, encabezado: `Glosario: ${g.termino}`, texto: g.texto,
  }))
  return unidades
}

/* ---------- 5. Ejecución ---------- */

const { lineas: crudas, totalPaginas } = await extraerLineas()
const lineas = limpiar(crudas)
const { capitulos, articulos, glosario } = segmentar(lineas)
const unidades = construirUnidades(articulos, capitulos, glosario)

const numeros = articulos.map((a) => a.numero)
const faltan = []
for (let n = 1; n <= Math.max(...numeros); n++) if (!numeros.includes(n)) faltan.push(n)
const duplicados = numeros.filter((n, i) => numeros.indexOf(n) !== i)
const sinCapitulo = articulos.filter((a) => a.capitulo === null).map((a) => a.numero)
const vacios = articulos.filter((a) => a.parrafos.join('').length < 20).map((a) => a.numero)

const salida = {
  meta: {
    fuente: URL_OFICIAL,
    edicion: 'Edición actualizada 2012 (modificaciones aprobadas por el Claustro Mayor, 2011-2012)',
    generado: new Date().toISOString(),
    totalPaginas,
    totalArticulos: articulos.length,
    totalUnidades: unidades.length,
    hash: createHash('sha256').update(JSON.stringify(unidades.map((u) => u.texto))).digest('hex').slice(0, 16),
  },
  capitulos,
  articulos,
  glosario,
  unidades,
}
await writeFile(RUTA_SALIDA, JSON.stringify(salida, null, 1), 'utf8')

console.log(`Páginas: ${totalPaginas} · Capítulos: ${capitulos.length} · Artículos: ${articulos.length} (${numeros[0]}–${numeros.at(-1)}) · Glosario: ${glosario.length} · Unidades: ${unidades.length}`)
console.log('Faltan:', faltan, '| Duplicados:', duplicados, '| Sin capítulo:', sinCapitulo, '| Vacíos:', vacios)
const toks = unidades.map((u) => tokensAprox(u.texto)).sort((a, b) => a - b)
console.log(`Tokens por unidad: min ${toks[0]} · mediana ${toks[Math.floor(toks.length / 2)]} · max ${toks.at(-1)}`)
console.log('Capítulos:'); for (const c of capitulos) console.log(`  ${c.romano.padEnd(5)} p.${String(c.pagina).padStart(3)}  ${c.titulo}`)
if (DEPURAR) {
  for (const n of [1, 23, 51, 146]) {
    const a = articulos.find((x) => x.numero === n)
    console.log(`\n--- Art. ${n} (cap. ${a.capitulo}, sección: ${a.seccion ?? '—'}, p.${a.pagina}) ---`)
    console.log(a.parrafos.join('\n¶ ').slice(0, 900))
  }
  console.log('\n--- Glosario (primeras 5) ---'); console.log(glosario.slice(0, 5))
  console.log('\n--- Líneas crudas tras GLOSARIO ---')
  const ig = lineas.findIndex((l) => /^GLOSARIO$/.test(l.texto))
  console.log(lineas.slice(ig, ig + 25).map((l) => l.texto).join('\n'))
}
console.log(`\nEscrito ${path.relative(RAIZ, RUTA_SALIDA)}`)
