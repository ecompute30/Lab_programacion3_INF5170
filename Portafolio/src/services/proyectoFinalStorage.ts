import { PROYECTO_FINAL_POR_DEFECTO } from '../data/proyectoFinal'
import type { ProyectoFinal } from '../types/proyecto'

const CLAVE_PROYECTO_FINAL = 'portafolio.proyecto-final'

/** Solo se aceptan enlaces http(s); evita que un "javascript:" llegue a un href o a un iframe. */
export function esUrlSegura(valor: string): boolean {
  if (valor.trim() === '') return true
  try {
    return ['http:', 'https:'].includes(new URL(valor.trim()).protocol)
  } catch {
    return false
  }
}

function sanear(datos: ProyectoFinal): ProyectoFinal {
  return {
    ...datos,
    urlDemo: esUrlSegura(datos.urlDemo) ? datos.urlDemo.trim() : '',
    urlCodigo: esUrlSegura(datos.urlCodigo) ? datos.urlCodigo.trim() : '',
    tecnologias: Array.isArray(datos.tecnologias) ? datos.tecnologias.filter((t) => typeof t === 'string') : [],
  }
}

export function cargarProyectoFinal(): ProyectoFinal {
  try {
    const crudo = localStorage.getItem(CLAVE_PROYECTO_FINAL)
    if (crudo) return sanear({ ...PROYECTO_FINAL_POR_DEFECTO, ...(JSON.parse(crudo) as Partial<ProyectoFinal>) })
  } catch {
    // Datos dañados: se usan los valores por defecto.
  }
  return { ...PROYECTO_FINAL_POR_DEFECTO }
}

export function guardarProyectoFinal(datos: ProyectoFinal): ProyectoFinal {
  const saneado = sanear(datos)
  localStorage.setItem(CLAVE_PROYECTO_FINAL, JSON.stringify(saneado))
  return saneado
}

export function restaurarProyectoFinal(): ProyectoFinal {
  localStorage.removeItem(CLAVE_PROYECTO_FINAL)
  return { ...PROYECTO_FINAL_POR_DEFECTO }
}

export function estaPublicado(proyecto: ProyectoFinal) {
  return proyecto.urlDemo.trim() !== ''
}
