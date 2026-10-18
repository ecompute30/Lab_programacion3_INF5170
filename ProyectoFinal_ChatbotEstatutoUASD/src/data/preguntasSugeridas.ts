/**
 * Las 35 preguntas sugeridas del enunciado oficial, agrupadas por tema para la
 * interfaz. `capitulosEsperados` sirve solo para evaluar la recuperación
 * (scripts/evaluar-recuperacion.ts): indica en qué capítulos del Estatuto
 * debería encontrarse la respuesta.
 */

export interface TemaSugerido {
  id: string
  nombre: string
  preguntas: PreguntaSugerida[]
}

export interface PreguntaSugerida {
  texto: string
  capitulosEsperados: number[]
  destacada?: boolean
}

export const TEMAS_SUGERIDOS: TemaSugerido[] = [
  {
    id: 'universidad',
    nombre: 'La Universidad',
    preguntas: [
      { texto: '¿Qué es la Universidad Autónoma de Santo Domingo?', capitulosEsperados: [1], destacada: true },
      { texto: '¿Cuál es la misión de la UASD?', capitulosEsperados: [1] },
      { texto: '¿Cuáles son los fines de la Universidad?', capitulosEsperados: [1] },
      { texto: '¿Cuáles son las funciones fundamentales de la UASD?', capitulosEsperados: [1, 3] },
      { texto: '¿Qué establece el Estatuto sobre la autonomía universitaria?', capitulosEsperados: [1], destacada: true },
      { texto: '¿Cuáles son los principios que orientan a la Universidad?', capitulosEsperados: [1] },
    ],
  },
  {
    id: 'gobierno',
    nombre: 'Organización y gobierno',
    preguntas: [
      { texto: '¿Cómo está organizada la Universidad?', capitulosEsperados: [2] },
      { texto: '¿Cuáles son los organismos de gobierno de la UASD?', capitulosEsperados: [2, 4, 5] },
      { texto: '¿Qué es el Claustro Mayor?', capitulosEsperados: [4], destacada: true },
      { texto: '¿Qué es el Claustro Menor?', capitulosEsperados: [4] },
      { texto: '¿Qué es el Consejo Universitario?', capitulosEsperados: [5] },
      { texto: '¿Quiénes integran el Consejo Universitario?', capitulosEsperados: [5], destacada: true },
      { texto: '¿Cuáles son las atribuciones del Consejo Universitario?', capitulosEsperados: [5] },
      { texto: '¿Cuáles son las funciones del Rector?', capitulosEsperados: [6] },
      { texto: '¿Cuáles son las funciones de los Vicerrectores?', capitulosEsperados: [7] },
    ],
  },
  {
    id: 'facultades',
    nombre: 'Facultades, escuelas y recintos',
    preguntas: [
      { texto: '¿Qué son las Facultades?', capitulosEsperados: [2] },
      { texto: '¿Cómo se organizan las Facultades?', capitulosEsperados: [2, 9, 10, 11] },
      { texto: '¿Qué son los Consejos Directivos de Facultad?', capitulosEsperados: [10] },
      { texto: '¿Cuáles son las funciones de los Decanos?', capitulosEsperados: [11] },
      { texto: '¿Qué son las Escuelas?', capitulosEsperados: [2] },
      { texto: '¿Cuáles son las funciones de los Directores de Escuela?', capitulosEsperados: [11] },
      { texto: '¿Qué establece el Estatuto sobre los Recintos, Centros y Subcentros Universitarios?', capitulosEsperados: [2] },
    ],
  },
  {
    id: 'docentes',
    nombre: 'Personal docente',
    preguntas: [
      { texto: '¿Qué establece el Estatuto sobre el personal docente?', capitulosEsperados: [12] },
      { texto: '¿Cuáles son los derechos del personal docente?', capitulosEsperados: [12], destacada: true },
      { texto: '¿Cuáles son los deberes del personal docente?', capitulosEsperados: [12] },
    ],
  },
  {
    id: 'estudiantes',
    nombre: 'Estudiantes',
    preguntas: [
      { texto: '¿Qué establece el Estatuto sobre los estudiantes?', capitulosEsperados: [13] },
      { texto: '¿Cuáles son los derechos de los estudiantes?', capitulosEsperados: [13], destacada: true },
      { texto: '¿Cuáles son los deberes de los estudiantes?', capitulosEsperados: [13] },
      { texto: '¿Qué establece el Estatuto sobre la representación estudiantil?', capitulosEsperados: [14] },
    ],
  },
  {
    id: 'areas',
    nombre: 'Funciones, patrimonio y disciplina',
    preguntas: [
      { texto: '¿Qué establece el Estatuto sobre la investigación?', capitulosEsperados: [1, 2, 7] },
      { texto: '¿Qué establece el Estatuto sobre el postgrado?', capitulosEsperados: [2, 7] },
      { texto: '¿Qué establece el Estatuto sobre la extensión universitaria?', capitulosEsperados: [1, 2, 7] },
      { texto: '¿Qué establece el Estatuto sobre el bienestar universitario?', capitulosEsperados: [1, 13] },
      { texto: '¿Qué establece el Estatuto sobre el régimen disciplinario?', capitulosEsperados: [12, 13, 17] },
      { texto: '¿Qué establece el Estatuto sobre el patrimonio universitario?', capitulosEsperados: [16] },
    ],
  },
]

export const PREGUNTAS_SUGERIDAS: PreguntaSugerida[] = TEMAS_SUGERIDOS.flatMap((t) => t.preguntas)
export const PREGUNTAS_DESTACADAS = PREGUNTAS_SUGERIDAS.filter((p) => p.destacada)
