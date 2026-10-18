import { normalizar } from '../services/catalogoStorage'

export interface Segmento {
  texto: string
  coincide: boolean
}

/**
 * Divide un texto en segmentos marcando los inicios de palabra que coinciden
 * con algún término de la consulta, sin distinguir tildes ni mayúsculas.
 */
export function resaltar(texto: string, consulta: string): Segmento[] {
  const terminos = normalizar(consulta).split(/[^a-z0-9.]+/).filter((t) => t.length > 0)
  if (terminos.length === 0) return [{ texto, coincide: false }]

  // Cada carácter original se normaliza por separado para conservar las posiciones.
  const caracteres = Array.from(texto)
  const normalizado = caracteres.map((c) => normalizar(c) || c).join('')
  const posiciones: number[] = []
  caracteres.forEach((c, i) => {
    for (let k = 0; k < (normalizar(c) || c).length; k++) posiciones.push(i)
  })

  const marcado = new Array<boolean>(caracteres.length).fill(false)
  for (const termino of terminos) {
    let desde = 0
    let indice: number
    while ((indice = normalizado.indexOf(termino, desde)) !== -1) {
      const inicioDePalabra = indice === 0 || /[^a-z0-9]/.test(normalizado[indice - 1] ?? '')
      if (inicioDePalabra) {
        for (let k = indice; k < indice + termino.length; k++) marcado[posiciones[k]!] = true
      }
      desde = indice + 1
    }
  }

  const segmentos: Segmento[] = []
  caracteres.forEach((c, i) => {
    const ultimo = segmentos.at(-1)
    if (ultimo && ultimo.coincide === marcado[i]) ultimo.texto += c
    else segmentos.push({ texto: c, coincide: marcado[i]! })
  })
  return segmentos
}
