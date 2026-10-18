export type Categoria = 'sitio' | 'aplicacion' | 'pruebas' | 'teoria'

export type NombreIcono =
  | 'Network'
  | 'UserRound'
  | 'IdCard'
  | 'Tags'
  | 'Landmark'
  | 'ListTree'
  | 'MonitorCheck'
  | 'ListChecks'
  | 'Gauge'
  | 'ArrowLeftRight'
  | 'ListTodo'
  | 'Layers'
  | 'BadgeCheck'
  | 'Leaf'
  | 'GraduationCap'

export interface Proyecto {
  id: string
  /** Número de práctica tal como aparece en el programa del curso ("4", "5.1"). */
  practica: string
  /** Posición en el recorrido del curso; varios proyectos pueden compartirla. */
  paso: number
  titulo: string
  resumen: string
  categoria: Categoria
  tecnologias: string[]
  icono: NombreIcono
  etiquetaDemo: string
  urlDemo?: string
  urlCodigo?: string
  nota?: string
}

/** Lo mínimo que necesita la previsualización, sea una práctica o el proyecto final. */
export interface ElementoVista {
  id: string
  etiqueta: string
  titulo: string
  url: string
  icono: NombreIcono
}

export interface ProyectoFinal {
  titulo: string
  resumen: string
  tecnologias: string[]
  urlDemo: string
  urlCodigo: string
  fechaEntrega: string
}

export interface Parada {
  clave: string
  numero: string
  descripcion: string
  completada: boolean
  visible: boolean
}
