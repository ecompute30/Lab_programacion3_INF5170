/**
 * Normalización léxica para español jurídico: sin tildes ni mayúsculas,
 * sin palabras vacías y con un recorte de sufijos ligero para que
 * "facultades", "facultad" y "facultativo" compartan raíz.
 */

const PALABRAS_VACIAS = new Set([
  'a', 'al', 'ante', 'bajo', 'con', 'contra', 'de', 'del', 'desde', 'durante', 'en', 'entre', 'hacia', 'hasta',
  'mediante', 'para', 'por', 'segun', 'sin', 'sobre', 'tras', 'y', 'e', 'o', 'u', 'ni', 'que', 'como', 'cuando',
  'donde', 'cual', 'cuales', 'quien', 'quienes', 'cuyo', 'cuya', 'cuyos', 'cuyas', 'el', 'la', 'los', 'las', 'lo',
  'un', 'una', 'unos', 'unas', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'se', 'si', 'no', 'es', 'son', 'ser', 'sera',
  'seran', 'fue', 'fueron', 'esta', 'estan', 'estar', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
  'aquel', 'aquella', 'hay', 'ha', 'han', 'he', 'haber', 'tiene', 'tienen', 'tener', 'puede', 'pueden', 'podra',
  'podran', 'debe', 'deben', 'debera', 'deberan', 'mas', 'menos', 'muy', 'tambien', 'asi', 'pues', 'dicho', 'dicha',
  'dichos', 'dichas', 'mismo', 'misma', 'mismos', 'mismas', 'otro', 'otra', 'otros', 'otras', 'todo', 'toda', 'todos',
  'todas', 'cada', 'cualquier', 'cualquiera', 'tal', 'tales', 'les', 'le', 'me', 'te', 'nos', 'os', 'yo', 'el',
  'ella', 'ellos', 'ellas', 'usted', 'ustedes', 'que', 'establece', 'dice', 'acerca', 'respecto',
])

const SUFIJOS = [
  ['ciones', 'cion'], ['siones', 'sion'], ['idades', 'idad'], ['mente', ''], ['amientos', 'amient'],
  ['imientos', 'imient'], ['amiento', 'amient'], ['imiento', 'imient'], ['adores', 'ador'], ['adoras', 'ador'],
  ['adora', 'ador'], ['ales', 'al'], ['iles', 'il'], ['ores', 'or'], ['oras', 'or'], ['ora', 'or'],
] as const

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function raiz(palabra: string): string {
  let p = palabra
  for (const [sufijo, reemplazo] of SUFIJOS) {
    if (p.length > sufijo.length + 2 && p.endsWith(sufijo)) {
      p = p.slice(0, -sufijo.length) + reemplazo
      break
    }
  }
  if (p.length > 4 && p.endsWith('es')) p = p.slice(0, -2)
  else if (p.length > 3 && p.endsWith('s')) p = p.slice(0, -1)
  if (p.length > 4 && /[aeo]$/.test(p)) p = p.slice(0, -1)
  return p
}

export function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t.length > 1 && !PALABRAS_VACIAS.has(t))
    .map(raiz)
    .filter((t) => t.length > 1)
}
