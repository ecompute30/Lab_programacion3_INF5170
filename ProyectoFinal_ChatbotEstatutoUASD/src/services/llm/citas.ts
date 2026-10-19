/**
 * Reconocimiento de citas a artículos en las respuestas. El prompt pide
 * "[Art. N]", pero los modelos también escriben "[Art. 100, literal a]",
 * "[Arts. 34 y 35]", "(Art. 12)" o "Artículo 7" en medio del texto; todas
 * se aceptan para que cada referencia sea verificable con un clic.
 */

const ART = String.raw`(?:Arts?\.?|Art[ií]culos?)`
const NUMEROS = String.raw`\d{1,3}(?:\s*(?:,|y|e|al|-|–)\s*\d{1,3})*`

/** Grupo 1: contenido entre corchetes; grupo 2: entre paréntesis; grupo 3: mención suelta. */
export const RE_CITAS = new RegExp(
  String.raw`\[\s*(${ART}\s*${NUMEROS}[^\]]{0,60})\]|\(\s*(${ART}\s*${NUMEROS}[^)]{0,60})\)|\b(${ART}\s+${NUMEROS})\b`,
  'gi',
)

export interface CitaDetectada {
  /** Texto que se muestra en el chip (por ejemplo, "Art. 100, literal a"). */
  etiqueta: string
  numeros: number[]
}

export function interpretarCita(coincidencia: RegExpMatchArray): CitaDetectada {
  const interior = (coincidencia[1] ?? coincidencia[2] ?? coincidencia[3] ?? '').trim()
  const numeros = [...new Set([...interior.matchAll(/\d{1,3}/g)].map((m) => Number(m[0])).filter((n) => n >= 1 && n <= 146))]
  return { etiqueta: interior.replace(/\s+/g, ' '), numeros }
}

/** Números de artículo citados en un texto, sin repetir y en orden de aparición. */
export function extraerCitas(texto: string): number[] {
  const citas = new Set<number>()
  for (const m of texto.matchAll(RE_CITAS)) for (const n of interpretarCita(m).numeros) citas.add(n)
  return [...citas]
}
