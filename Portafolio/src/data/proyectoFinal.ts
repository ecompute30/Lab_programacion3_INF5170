import type { ProyectoFinal } from '../types/proyecto'

const BASE_PAGES = 'https://ecompute30.github.io/Lab_programacion3_INF5170'
const BASE_REPO = 'https://github.com/ecompute30/Lab_programacion3_INF5170/tree/main'

/**
 * Datos de referencia del proyecto final. La vista de administración guarda
 * una versión editada en localStorage que prevalece sobre estos valores.
 */
export const PROYECTO_FINAL_POR_DEFECTO: ProyectoFinal = {
  titulo: 'Primada — Asistente del Estatuto Orgánico de la UASD',
  resumen:
    'Chatbot con inteligencia artificial que responde preguntas sobre el Estatuto Orgánico citando sus artículos. RAG en el navegador (BM25 + embeddings), Gemini con respaldo en Groq y modo sin IA, sin backend.',
  tecnologias: ['Vue 3', 'TypeScript', 'RAG', 'Gemini API', 'BM25', 'Playwright'],
  urlDemo: `${BASE_PAGES}/ProyectoFinal_ChatbotEstatutoUASD/dist/`,
  urlCodigo: `${BASE_REPO}/ProyectoFinal_ChatbotEstatutoUASD`,
  fechaEntrega: '',
}
