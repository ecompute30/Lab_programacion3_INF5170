const formato = new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium', timeStyle: 'short' })

export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? 'sin registro' : formato.format(fecha)
}
