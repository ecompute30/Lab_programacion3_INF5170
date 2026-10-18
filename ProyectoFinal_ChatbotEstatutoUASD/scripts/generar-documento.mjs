/**
 * Genera docs/Documento-tecnico.docx (Word editable) con la librería `docx`.
 * Las capturas se leen de docs/img/. Ejecutar: `npm run documento`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AlignmentType, BorderStyle, Document, Footer, HeadingLevel, ImageRun, LevelFormat, PageNumber, Packer, Paragraph,
  ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, 'docs/Documento-tecnico.docx')
const IMG = (n) => path.join(RAIZ, 'docs/img', n)

const AZUL = '17499F', TINTA = '0D2A5C', GRIS = '5B6676', NIEBLA = 'E8EFF9', BORDE = 'E1E7F0'
const ANCHO_TEXTO = 9360 // Carta (12240) menos márgenes de 1" (2 × 1440)

const texto = (t, extra = {}) => new TextRun({ text: t, font: 'Calibri', size: 22, ...extra })
const p = (t, extra = {}) => new Paragraph({ children: typeof t === 'string' ? [texto(t)] : t, spacing: { after: 140, line: 300 }, ...extra })
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: 'Calibri', size: 32, bold: true, color: TINTA })], spacing: { before: 360, after: 160 } })
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: 'Calibri', size: 26, bold: true, color: AZUL })], spacing: { before: 240, after: 120 } })
const vineta = (t) => new Paragraph({ children: typeof t === 'string' ? [texto(t)] : t, numbering: { reference: 'vinetas', level: 0 }, spacing: { after: 80, line: 300 } })
const numerado = (t) => new Paragraph({ children: typeof t === 'string' ? [texto(t)] : t, numbering: { reference: 'numeros', level: 0 }, spacing: { after: 80, line: 300 } })
const negrita = (t) => texto(t, { bold: true })
const codigo = (t) => new TextRun({ text: t, font: 'Consolas', size: 20, color: TINTA })
const bloqueCodigo = (lineas) =>
  lineas.map((l) => new Paragraph({
    children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 17 })],
    spacing: { after: 0, line: 240 },
    shading: { type: ShadingType.CLEAR, fill: 'F5F7FB', color: 'auto' },
    indent: { left: 200, right: 200 },
  }))

const bordes = { top: { style: BorderStyle.SINGLE, size: 4, color: BORDE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDE }, left: { style: BorderStyle.SINGLE, size: 4, color: BORDE }, right: { style: BorderStyle.SINGLE, size: 4, color: BORDE } }

function tabla(encabezados, filas, anchos) {
  const celda = (contenido, ancho, esEncabezado = false) =>
    new TableCell({
      width: { size: ancho, type: WidthType.DXA },
      borders: bordes,
      shading: esEncabezado ? { type: ShadingType.CLEAR, fill: NIEBLA, color: 'auto' } : undefined,
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [texto(contenido, { bold: esEncabezado, size: 20, color: esEncabezado ? TINTA : undefined })], spacing: { after: 0 } })],
    })
  return new Table({
    width: { size: anchos.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, anchos[i], true)) }),
      ...filas.map((f) => new TableRow({ children: f.map((c, i) => celda(c, anchos[i])) })),
    ],
  })
}

async function imagen(nombre, pie, anchoPx = 600) {
  try {
    const datos = await readFile(IMG(nombre))
    const alto = Math.round(anchoPx * 0.625)
    return [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: datos, transformation: { width: anchoPx, height: alto } })], spacing: { before: 120, after: 60 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [texto(pie, { italics: true, size: 18, color: GRIS })], spacing: { after: 200 } }),
    ]
  } catch {
    return [p([texto(`[Captura pendiente: ${nombre}]`, { italics: true, color: GRIS })])]
  }
}

const portada = [
  new Paragraph({ spacing: { before: 2400 } }),
  new Paragraph({ children: [new TextRun({ text: 'Primada', font: 'Calibri', size: 72, bold: true, color: AZUL })], spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: 'Asistente conversacional del Estatuto Orgánico de la UASD', font: 'Calibri', size: 32, color: TINTA })], spacing: { after: 120 } }),
  new Paragraph({ children: [new TextRun({ text: 'Documento técnico del proyecto final', font: 'Calibri', size: 24, color: GRIS })], spacing: { after: 600 } }),
  tabla(
    ['Dato', 'Detalle'],
    [
      ['Asignatura', 'INF-5170 Laboratorio de Programación III — Universidad Autónoma de Santo Domingo'],
      ['Profesor', 'Radhames Silverio González'],
      ['Estudiante', 'Edwin Alberto Roman Seberino (matrícula 100732067)'],
      ['Fecha', new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Aplicación en línea', 'https://ecompute30.github.io/Lab_programacion3_INF5170/ProyectoFinal_ChatbotEstatutoUASD/dist/'],
      ['Código fuente', 'https://github.com/ecompute30/Lab_programacion3_INF5170 (carpeta ProyectoFinal_ChatbotEstatutoUASD)'],
      ['Presentación', 'https://ecompute30.github.io/Lab_programacion3_INF5170/ProyectoFinal_ChatbotEstatutoUASD/dist/presentacion/'],
    ],
    [2400, 6960],
  ),
  new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: false }),
]

const cuerpo = [
  h1('1. Resumen'),
  p('Primada es una aplicación web tipo chatbot que responde, en lenguaje natural y en español, preguntas sobre el Estatuto Orgánico de la Universidad Autónoma de Santo Domingo. Cada respuesta se fundamenta exclusivamente en los artículos del documento oficial, se cita con el formato [Art. N] y puede verificarse en un clic: el artículo completo se abre dentro de la aplicación y enlaza a la página exacta del PDF. Cuando el Estatuto no cubre lo preguntado, el asistente lo dice con una frase fija en lugar de inventar.'),
  p('La aplicación está construida con Vue 3 y TypeScript, se ejecuta íntegramente en el navegador (sin servidor propio) y se publica en GitHub Pages. La inteligencia artificial se integra mediante el patrón RAG (Retrieval-Augmented Generation): el sistema recupera primero los artículos pertinentes con búsqueda léxica y semántica, y luego un modelo de lenguaje (Google Gemini) redacta la respuesta usando únicamente ese contexto. Si el modelo no está disponible, la aplicación degrada a un proveedor de respaldo (Groq) y, en último caso, muestra los artículos encontrados sin redactar.'),

  h1('2. Objetivos cubiertos'),
  p('El proyecto responde a los requerimientos del enunciado de la siguiente manera:'),
  tabla(
    ['Requerimiento', 'Cómo se cumple'],
    [
      ['Interfaz web moderna y responsive', 'SPA en Vue 3 con el design system del Portafolio del curso (azul institucional, tipografías Bricolage Grotesque y Public Sans), adaptada a computadora, tableta y teléfono.'],
      ['Pantalla principal, área de conversación, campo y botón de envío', 'Vista de chat con hilo de mensajes, compositor con envío por Enter y botón, indicador de estado ("Buscando en el Estatuto…", "Redactando…").'],
      ['Preguntas sugeridas visibles y seleccionables', 'Las 35 preguntas del enunciado, agrupadas en 6 temas; 6 destacadas en el inicio y el resto en un panel "Ver las 35 preguntas por tema".'],
      ['Historial básico', 'Varias conversaciones por usuario, con título automático, renombrar y eliminar, guardadas en el navegador y con URL propia (#/c/id).'],
      ['Procesamiento e interpretación de preguntas', 'Normalización en español, búsqueda híbrida BM25 + embeddings, uso de la pregunta anterior en seguimientos cortos.'],
      ['Búsqueda inteligente dentro del Estatuto', 'Recuperación de los 8 fragmentos más relevantes entre 222 unidades indexadas (artículos y glosario).'],
      ['Generación de respuestas claras y contextualizadas', 'Modelo Gemini Flash-Lite con un prompt de reglas estrictas y streaming de la respuesta.'],
      ['Indicar cuando no hay información; evitar inventos', 'Regla explícita con frase fija; el modelo solo puede citar artículos que recibió en el contexto; respuestas saneadas.'],
      ['Buenas prácticas, componentes reutilizables, manejo de errores', 'Composition API y composables, servicios tipados, cadena de respaldo con errores clasificados, pruebas automatizadas.'],
    ],
    [3200, 6160],
  ),

  h1('3. Tecnologías utilizadas'),
  tabla(
    ['Capa', 'Tecnología', 'Para qué se usa'],
    [
      ['Interfaz', 'Vue 3 (Composition API, <script setup>), TypeScript, Vite, Vue Router (hash), lucide-vue-next', 'Componentes reactivos, tipado estático, enrutamiento compatible con GitHub Pages, iconografía.'],
      ['IA: generación', 'Google Gemini API (REST, modelo gemini-3.5-flash-lite) con streaming SSE', 'Redacción de la respuesta a partir del contexto recuperado; se consume con fetch, sin SDK.'],
      ['IA: embeddings', 'gemini-embedding-2 (768 dimensiones)', 'Representación semántica de los fragmentos (calculada una vez en build) y de cada pregunta.'],
      ['IA: respaldo', 'Groq (API compatible con OpenAI, modelo llama-3.3-70b-versatile)', 'Segundo proveedor si Gemini falla por cuota, red o clave.'],
      ['Recuperación', 'BM25, similitud de coseno y fusión RRF implementados en TypeScript', 'Búsqueda léxica y semántica en el navegador, sin dependencias externas.'],
      ['Procesamiento del PDF', 'Node.js + pdfjs-dist', 'Extracción y segmentación del Estatuto en capítulos, artículos, párrafos y glosario (script de build).'],
      ['Seguridad', 'Web Crypto API (AES-GCM, PBKDF2), IndexedDB, DOMPurify + marked', 'Cifrado de claves de API por dispositivo, contraseñas con hash y sal, renderizado seguro del Markdown.'],
      ['Persistencia', 'localStorage e IndexedDB', 'Cuentas, sesión, conversaciones, configuración y clave de cifrado del dispositivo.'],
      ['Calidad', 'Playwright, script de evaluación de recuperación, vue-tsc', 'Pruebas de extremo a extremo con la API simulada, métrica de acierto de la búsqueda, verificación de tipos.'],
      ['Despliegue', 'GitHub Pages', 'Publicación como sitio estático; sin backend ni base de datos.'],
    ],
    [1700, 3300, 4360],
  ),

  h1('4. Arquitectura del sistema'),
  p('La solución se divide en dos momentos. En tiempo de construcción (build), dos scripts de Node preparan el conocimiento: uno convierte el PDF oficial en un corpus estructurado y otro calcula los embeddings de cada fragmento. En tiempo de ejecución, todo ocurre en el navegador: la interfaz Vue, la recuperación, la construcción del prompt, la llamada al modelo y la persistencia.'),
  ...bloqueCodigo([
    'BUILD (una vez, Node)                         NAVEGADOR (cada pregunta)',
    '',
    'PDF oficial (113 páginas)                     Interfaz Vue (ChatView, Compositor, Burbujas, Citas)',
    '  └─ construir-corpus.mjs                               │ pregunta',
    '       limpieza, capítulos, 146 artículos,              ▼',
    '       párrafos, páginas  ──► estatuto.json ──►  Recuperador: BM25 + vectorial → fusión RRF → 8 fragmentos',
    '  └─ generar-embeddings.mjs                             │ artículos',
    '       gemini-embedding-2 ──► embeddings.json ──►       ▼',
    '                                                Prompt del sistema: reglas + <articulo numero="N">…</articulo>',
    '                                                        ▼',
    '                                                Cadena de proveedores: Gemini → Groq → modo extractivo',
    '                                                        ▼ streaming',
    '                                                Respuesta con [Art. N] → panel del artículo → página del PDF',
    '',
    'Persistencia en el cliente: localStorage (cuentas, sesión, conversaciones, configuración)',
    '                            IndexedDB (clave AES-GCM no extraíble para cifrar las claves de API)',
  ]),
  p(''),
  h2('4.1 Organización del código'),
  tabla(
    ['Carpeta', 'Contenido'],
    [
      ['scripts/', 'construir-corpus.mjs, generar-embeddings.mjs, evaluar-recuperacion.ts, generar-documento.mjs'],
      ['public/corpus/', 'estatuto.json (artículos, capítulos, glosario, unidades) y embeddings.json (vectores Int8)'],
      ['public/docs/', 'PDF oficial del Estatuto; las citas enlazan a su página exacta'],
      ['src/services/recuperacion/', 'normalizar.ts, bm25.ts, vectorial.ts, hibrida.ts, recuperar.ts'],
      ['src/services/llm/', 'tipos.ts, promptSistema.ts, proveedorGemini.ts, proveedorOpenAICompatible.ts, proveedorExtractivo.ts, cadenaProveedores.ts, sse.ts'],
      ['src/services/', 'corpus.ts, configStorage.ts (cifrado), conversacionesStorage.ts, authStorage.ts'],
      ['src/composables/', 'useChat (orquesta recuperar → prompt → stream → persistir), useConversaciones, useConfiguracion, useAuth'],
      ['src/components/chat/', 'ListaMensajes, MensajeBurbuja, Compositor, EstadoVacio, ModalPreguntas, PanelArticulo, PanelConversaciones, TrazaTecnica, IndicadorEscribiendo'],
      ['src/views/', 'ChatView, ConfiguracionView (solo administrador), LoginView, CuentaView'],
    ],
    [2600, 6760],
  ),
  h2('4.2 Decisiones de diseño'),
  vineta([negrita('Sin backend. '), texto('El proyecto se presenta pocos días y debe publicarse en GitHub Pages; toda la lógica vive en el cliente. El costo de esta decisión es que la clave de API viaja en las peticiones del navegador, lo que se mitiga restringiéndola por dominio y usando la capa gratuita del proveedor.')]),
  vineta([negrita('RAG aunque el Estatuto quepa en el contexto. '), texto('El documento completo ocupa unos 45 mil tokens y cabría en una sola petición; se eligió RAG porque reduce unas diez veces los tokens por pregunta, respeta los límites por minuto de la capa gratuita y hace explícita la búsqueda dentro del Estatuto, con citas verificables.')]),
  vineta([negrita('Degradar, no fallar. '), texto('La cadena Gemini → Groq → modo extractivo garantiza que la demostración siempre responda algo útil, igual que el patrón API → localStorage de la Práctica 7.')]),
  vineta([negrita('Mismo design system y mismas cuentas del Portafolio. '), texto('Ambas aplicaciones comparten origen en GitHub Pages y, por tanto, el almacenamiento local: la sesión y las contraseñas valen para las dos.')]),

  h1('5. Integración de la inteligencia artificial'),
  h2('5.1 El patrón RAG en tres pasos'),
  numerado([negrita('Recuperar. '), texto('La pregunta se normaliza (sin tildes, sin palabras vacías, con raíces) y se busca en 222 unidades: 146 artículos (los largos subdivididos en partes de hasta 450 tokens) y 65 términos del glosario. Se obtienen dos rankings: BM25 (coincidencia léxica ponderada) y similitud de coseno entre el embedding de la pregunta y los de las unidades. Ambos se fusionan con Reciprocal Rank Fusion; el glosario se penaliza para no desplazar artículos y, en preguntas del tipo "¿qué es X?", se favorece la unidad que empieza definiendo X. Se entregan hasta 8 fragmentos dentro de un presupuesto de 3 500 tokens.')]),
  numerado([negrita('Aumentar. '), texto('Se construye la instrucción del sistema con la identidad del asistente, siete reglas y los fragmentos en bloques <articulo numero="N" fuente="…">. El historial reciente (hasta 6 turnos) se envía como conversación para resolver seguimientos como "¿y sus deberes?".')]),
  numerado([negrita('Generar. '), texto('Gemini Flash-Lite redacta en streaming (streamGenerateContent con alt=sse). El texto se muestra a medida que llega y se guarda cada 300 ms. Al terminar se extraen las citas [Art. N] y se registran el proveedor, el modelo, la duración y los tokens.')]),
  h2('5.2 Reglas del prompt del sistema'),
  ...bloqueCodigo([
    'Usted es «Primada», asistente del Estatuto Orgánico de la UASD.',
    '1. Responda únicamente con la información de los artículos que aparecen en <contexto>.',
    '2. Cite el artículo que respalda cada afirmación con el formato exacto [Art. N].',
    '3. Si el contexto no alcanza, diga textualmente: «El Estatuto Orgánico no contiene',
    '   información suficiente para responder esta pregunta.» y sugiera cómo reformular.',
    '4. Si la pregunta no trata sobre el Estatuto, indique con cortesía que solo puede ayudar con él.',
    '5. Sea claro y breve: español, trato de usted, uno a tres párrafos o una lista. Sin emojis.',
    '6. Use la conversación previa para entender seguimientos; fundamente solo en el contexto actual.',
    '7. Use el nombre completo del organismo la primera vez y la terminología del Estatuto.',
  ]),
  p(''),
  h2('5.3 Proveedores y cadena de respaldo'),
  tabla(
    ['Orden', 'Proveedor', 'Cuándo se usa', 'Qué pasa si falla'],
    [
      ['1', 'Google Gemini (gemini-3.5-flash-lite)', 'Siempre que haya clave configurada', 'Cuota agotada (429), clave inválida, red o bloqueo → siguiente'],
      ['2', 'Groq (llama-3.3-70b-versatile)', 'Si Gemini falla y hay clave de Groq', 'Mismos criterios → siguiente'],
      ['3', 'Modo extractivo (sin IA)', 'Siempre disponible', 'Muestra los artículos recuperados con un aviso; la demostración nunca se queda sin respuesta'],
    ],
    [800, 2800, 2600, 3160],
  ),
  p(''),
  h2('5.4 Gestión de las claves de API'),
  p('Al no existir un servidor, cualquier clave usada por la aplicación es visible en las peticiones del navegador. Por ello se aplican tres capas: (1) la clave de Gemini se restringe en Google Cloud a la API Generative Language y a los dominios de la aplicación, y se mantiene en capa gratuita o con presupuesto con tope; (2) el administrador ingresa la clave desde la pantalla de Configuración y se guarda cifrada con AES-GCM usando una clave no extraíble generada por el navegador y almacenada en IndexedDB, de modo que copiar el almacenamiento local a otro equipo no la revela; (3) opcionalmente, el build puede incluir una clave por defecto codificada en base64, lo que se documenta como ofuscación y no como seguridad.'),

  h1('6. Funcionamiento del chatbot'),
  h2('6.1 Flujo de una consulta'),
  numerado('La persona inicia sesión (cuentas mconcepcion o admin) y llega a la pantalla principal con el saludo, seis preguntas destacadas y el acceso a las 35 preguntas por tema.'),
  numerado('Escribe una pregunta o elige una sugerida. Enter la envía; Shift + Enter inserta un salto de línea.'),
  numerado('El compositor indica "Buscando en el Estatuto…" mientras se recuperan los fragmentos (milisegundos) y, si hay embeddings, se vectoriza la pregunta con una llamada a la API.'),
  numerado('Indica "Redactando…" y la respuesta aparece por streaming. Es posible detenerla con Esc o con el botón de detener.'),
  numerado('La respuesta muestra chips [Art. N] y la lista de artículos consultados. Al pulsar uno se abre un panel lateral con el artículo completo, su capítulo, navegación entre artículos y el enlace "Ver en el PDF oficial, pág. N".'),
  numerado('La conversación se guarda en el navegador con un título automático y una URL propia; el panel lateral permite crear, renombrar y eliminar conversaciones.'),
  numerado('Si el administrador activa la traza técnica, bajo cada respuesta se despliega la consulta efectiva, los rankings BM25 y vectorial, los fragmentos entregados, el proveedor usado, la duración y los tokens.'),
  ...(await imagen('inicio.png', 'Figura 1. Pantalla principal con las preguntas destacadas.')),
  ...(await imagen('respuesta.png', 'Figura 2. Respuesta con citas a artículos, artículos consultados y traza técnica.')),
  h2('6.2 Pantalla de configuración (administrador)'),
  p('Permite pegar las claves de Gemini y Groq, elegir el modelo, probar la conexión (valida clave y restricciones sin gastar tokens), definir el orden de los proveedores, activar la traza técnica y consultar el estado del corpus (artículos, unidades, glosario, embeddings).'),
  ...(await imagen('configuracion.png', 'Figura 3. Configuración de proveedores, claves y corpus.')),

  h1('7. Uso del Estatuto Orgánico como fuente de información'),
  p('La única fuente de conocimiento es el PDF oficial publicado por la Dirección de Postgrado de la UASD (edición actualizada 2012, 113 páginas), versionado en el repositorio para que las citas enlacen a su página exacta. El script construir-corpus.mjs:'),
  vineta('Extrae el texto de cada página con pdfjs-dist, conservando el número de página.'),
  vineta('Elimina los encabezados y pies repetidos ("Aprobado por el Claustro Mayor N", "N Estatuto Orgánico") y une las palabras partidas por guion al final de línea.'),
  vineta('Detecta la estructura: 22 capítulos (incluidos dos escritos como "Capítulo VII:" y "Capítulo XIX"), 146 artículos continuos del 1 al 146, "Párrafos" e incisos, y el glosario de 65 términos aprobado por el Consejo Universitario.'),
  vineta('Subdivide los artículos largos en partes de hasta 450 tokens y produce 222 unidades de recuperación con su encabezado ("Artículo 34. Capítulo V: Del Consejo Universitario").'),
  vineta('Verifica que no falten ni se dupliquen artículos y guarda un hash del corpus; los embeddings se rechazan si no corresponden a la misma versión.'),
  p('Para medir la recuperación se usan las 35 preguntas del enunciado, cada una asociada al capítulo donde debería hallarse la respuesta. El script evaluar-recuperacion.ts calcula el acierto@5: con búsqueda léxica BM25, 35 de 35 preguntas tienen un artículo del capítulo esperado entre los cinco primeros resultados. La cifra es optimista porque la regla que favorece artículos definitorios se ajustó observando estas mismas preguntas; la búsqueda híbrida con embeddings se evalúa con el mismo script.'),

  h1('8. Pruebas realizadas'),
  tabla(
    ['Nivel', 'Qué se verificó', 'Herramienta'],
    [
      ['Corpus', '146/146 artículos sin faltantes ni duplicados; 22 capítulos con título completo; 65 términos del glosario', 'Validaciones del script de build'],
      ['Recuperación', 'Acierto@5 con las 35 preguntas sugeridas', 'npm run evaluar'],
      ['Tipos y build', 'Compilación sin errores de TypeScript ni de plantillas', 'vue-tsc + Vite'],
      ['Interfaz (27 comprobaciones)', 'Redirección al login; permisos de revisora y administrador; estado vacío; respuesta con citas y streaming; prompt del sistema con contexto; panel de artículo y enlace al PDF; navegación con teclado; seguimiento con historial; persistencia al recargar; respaldo ante 429; modal de 35 preguntas; clave cifrada (no aparece en texto plano); vista móvil', 'Playwright (Chromium) con la API de Gemini simulada'],
      ['Diseño', 'Antipatrones visuales y movimiento', 'Detector de impeccable; revisión manual de animaciones y reduced-motion'],
    ],
    [2000, 5160, 2200],
  ),

  h1('9. Limitaciones y trabajo futuro'),
  vineta('La capa gratuita de Gemini impone límites por minuto y por día; en una demostración intensa puede activarse el respaldo. Activar facturación con un presupuesto pequeño elimina esa restricción.'),
  vineta('Sin servidor, la clave de API es visible para quien inspeccione el navegador; la restricción por dominio y la cuota acotan el riesgo, pero una versión de producción usaría un proxy mínimo (por ejemplo, un Cloudflare Worker).'),
  vineta('El historial vive en el navegador: no se sincroniza entre dispositivos.'),
  vineta('El corpus cubre el Estatuto Orgánico; los reglamentos complementarios quedan fuera de alcance.'),
  vineta('Mejoras posibles: reescritura de la consulta con el propio modelo para seguimientos complejos, evaluación de la calidad de las respuestas con un conjunto de pares pregunta-respuesta, y lectura en voz alta.'),

  h1('10. Referencias'),
  vineta('Estatuto Orgánico de la UASD (PDF oficial): https://postgrado.uasd.edu.do/wp-content/uploads/2024/06/ESTATUTO-ORGANICO-UASD.pdf'),
  vineta('Gemini API — generateContent y embeddings: https://ai.google.dev/api'),
  vineta('Robertson, S. y Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond.'),
  vineta('Cormack, G., Clarke, C. y Buettcher, S. (2009). Reciprocal Rank Fusion outperforms Condorcet and individual rank learning methods.'),
  vineta('Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.'),
  vineta('Vue.js: https://vuejs.org · Vite: https://vite.dev · Playwright: https://playwright.dev'),
]

const documento = new Document({
  creator: 'Edwin A. Roman Seberino',
  title: 'Primada — Documento técnico',
  description: 'Documento técnico del proyecto final INF-5170',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  numbering: {
    config: [
      { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
      { reference: 'numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [texto('Primada · Proyecto final INF-5170 · Página ', { size: 18, color: GRIS }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 18, color: GRIS })] })],
        }),
      },
      children: [...portada, new Paragraph({ children: [], pageBreakBefore: true }), ...cuerpo],
    },
  ],
})

await writeFile(SALIDA, await Packer.toBuffer(documento))
console.log(`Escrito ${path.relative(RAIZ, SALIDA)}`)
