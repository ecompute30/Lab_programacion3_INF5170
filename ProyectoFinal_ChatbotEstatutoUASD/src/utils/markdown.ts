import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { RE_CITAS, interpretarCita } from '../services/llm/citas'

/**
 * Markdown de las respuestas → HTML seguro. Las citas [Art. N] se convierten
 * en botones con `data-articulo` para abrir el artículo desde la burbuja.
 */

marked.use({ gfm: true, breaks: true })

DOMPurify.addHook('afterSanitizeAttributes', (nodo) => {
  if (nodo.tagName === 'A') {
    nodo.setAttribute('target', '_blank')
    nodo.setAttribute('rel', 'noopener noreferrer')
  }
})

const OPCIONES_PURIFICACION = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'button', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'type', 'data-articulo', 'title'],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#)/i,
}

const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function enlazarCitas(html: string) {
  return html.replace(RE_CITAS, (...args) => {
    const coincidencia = args[0] as string
    const { etiqueta, numeros } = interpretarCita(args as unknown as RegExpMatchArray)
    if (numeros.length === 0) return coincidencia
    // Una sola cita conserva su detalle ("Art. 100, literal a"); varias se separan en un chip por artículo.
    if (numeros.length === 1) {
      return `<button type="button" class="cita" data-articulo="${numeros[0]}" title="Ver el artículo ${numeros[0]}">${escapar(etiqueta)}</button>`
    }
    return numeros
      .map((n) => `<button type="button" class="cita" data-articulo="${n}" title="Ver el artículo ${n}">Art. ${n}</button>`)
      .join(' ')
  })
}

export function renderizarMarkdown(texto: string): string {
  const html = marked.parse(texto, { async: false })
  return DOMPurify.sanitize(enlazarCitas(html), OPCIONES_PURIFICACION)
}
