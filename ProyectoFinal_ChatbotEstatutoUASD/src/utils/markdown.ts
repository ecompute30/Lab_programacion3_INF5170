import DOMPurify from 'dompurify'
import { marked } from 'marked'

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

const RE_CITA = /\[Art\.?\s*(\d{1,3}(?:\s*(?:,|y)\s*\d{1,3})*)\]/gi

function enlazarCitas(html: string) {
  return html.replace(RE_CITA, (_coincidencia, lista: string) =>
    lista
      .split(/\s*(?:,|y)\s*/)
      .filter(Boolean)
      .map((n) => `<button type="button" class="cita" data-articulo="${n}" title="Ver el artículo ${n}">Art. ${n}</button>`)
      .join(' '),
  )
}

export function renderizarMarkdown(texto: string): string {
  const html = marked.parse(texto, { async: false })
  return DOMPurify.sanitize(enlazarCitas(html), OPCIONES_PURIFICACION)
}
