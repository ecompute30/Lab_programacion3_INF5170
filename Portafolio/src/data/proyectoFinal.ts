import type { ProyectoFinal } from '../types/proyecto'

/**
 * Datos de referencia del proyecto final. Cuando esté listo, basta con
 * completar las URL aquí (o desde la vista de administración, que guarda
 * una versión editada en localStorage).
 */
export const PROYECTO_FINAL_POR_DEFECTO: ProyectoFinal = {
  titulo: 'Proyecto final',
  resumen: 'Proyecto integrador del laboratorio. Su descripción y enlaces se publicarán aquí al entregarlo.',
  tecnologias: [],
  urlDemo: '',
  urlCodigo: '',
  fechaEntrega: '',
}
