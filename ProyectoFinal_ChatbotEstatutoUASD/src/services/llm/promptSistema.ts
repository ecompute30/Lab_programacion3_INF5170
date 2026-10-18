import type { FragmentoContexto } from './tipos.ts'

export const FRASE_SIN_INFORMACION =
  'El Estatuto Orgánico no contiene información suficiente para responder esta pregunta.'

const REGLAS = `Usted es «Primada», asistente del Estatuto Orgánico de la Universidad Autónoma de Santo Domingo (UASD).

Reglas que debe cumplir siempre:
1. Responda únicamente con la información de los artículos que aparecen en <contexto>. No use conocimiento externo ni suposiciones.
2. Cite el artículo que respalda cada afirmación con el formato exacto [Art. N] (por ejemplo, [Art. 23]). Nunca cite un artículo que no esté en el contexto.
3. Si el contexto no alcanza para responder, diga textualmente: «${FRASE_SIN_INFORMACION}» y sugiera cómo reformular la pregunta. No invente.
4. Si la pregunta no trata sobre el Estatuto Orgánico ni sobre la organización de la UASD, indique con cortesía que solo puede ayudar con el contenido del Estatuto.
5. Sea claro y breve: responda en español, con trato de usted, en uno a tres párrafos cortos o una lista si enumera atribuciones, derechos o deberes. Sin emojis.
6. Cuando el usuario haga una pregunta de seguimiento, use la conversación previa para entenderla, pero fundamente la respuesta solo en el contexto actual.
7. Use el nombre completo del organismo la primera vez (por ejemplo, «Consejo Universitario») y mantenga la terminología del Estatuto.`

function escaparXml(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function construirInstruccionSistema(fragmentos: FragmentoContexto[]): string {
  const contexto = fragmentos
    .map((f) => {
      const etiqueta = f.articulo ? `articulo numero="${f.articulo}"` : 'glosario'
      return `<${etiqueta} fuente="${escaparXml(f.encabezado)}">\n${escaparXml(f.texto)}\n</${f.articulo ? 'articulo' : 'glosario'}>`
    })
    .join('\n\n')
  return `${REGLAS}\n\n<contexto>\n${contexto}\n</contexto>`
}

/** Extrae los números de artículo citados como [Art. N] en una respuesta. */
export function extraerCitas(texto: string): number[] {
  const citas = new Set<number>()
  for (const m of texto.matchAll(/\[Art\.?\s*(\d{1,3})(?:\s*(?:,|y)\s*(\d{1,3}))*\]/gi)) {
    for (const n of m[0].matchAll(/\d{1,3}/g)) citas.add(Number(n[0]))
  }
  return [...citas]
}
