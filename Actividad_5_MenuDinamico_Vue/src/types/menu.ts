export interface MenuItem {
  id: number
  nombre: string
  enlace: string
  icono?: string
  submenu?: MenuItem[]
}

export interface MenuData {
  menu: MenuItem[]
}

export interface NuevaOpcionForm {
  nombre: string
  enlace: string
  icono: string
  padreId: number | null
}
