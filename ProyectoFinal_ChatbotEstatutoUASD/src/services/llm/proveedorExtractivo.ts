import { FRASE_SIN_INFORMACION } from './promptSistema.ts'
import type { ProveedorLLM, RespuestaLLM, ResultadoPrueba, SolicitudRespuesta } from './tipos.ts'

/**
 * Último eslabón de la cadena: no usa red. Presenta los artículos recuperados
 * tal cual, para que la consulta siga siendo útil aunque ningún modelo
 * responda. Es un resultado de búsqueda, no una redacción.
 */

const MAX_ARTICULOS = 4
const MAX_CARACTERES = 420

export class ProveedorExtractivo implements ProveedorLLM {
  readonly id = 'extractivo' as const
  readonly nombre = 'Búsqueda en el Estatuto (sin IA)'
  readonly modelo = 'bm25'
  readonly disponible = true

  async responder(solicitud: SolicitudRespuesta, alRecibirDelta: (texto: string) => void): Promise<RespuestaLLM> {
    const articulos = solicitud.fragmentos.filter((f) => f.articulo !== null).slice(0, MAX_ARTICULOS)
    let texto: string
    if (articulos.length === 0) {
      texto = `${FRASE_SIN_INFORMACION} No se encontraron artículos relacionados con su pregunta; intente con otras palabras.`
    } else {
      const lista = articulos
        .map((f) => {
          const extracto = f.texto.length > MAX_CARACTERES ? `${f.texto.slice(0, MAX_CARACTERES).trimEnd()}…` : f.texto
          const ubicacion = f.encabezado.replace(/^Artículo \d+\.\s*/, '')
          return `**${ubicacion}** [Art. ${f.articulo}]\n${extracto}`
        })
        .join('\n\n')
      texto = `No fue posible consultar al modelo de inteligencia artificial en este momento. Estos son los artículos del Estatuto Orgánico más relacionados con su pregunta:\n\n${lista}`
    }
    alRecibirDelta(texto)
    return { texto, proveedor: this.id, modelo: this.modelo, motivoFin: 'extractivo' }
  }

  async probar(): Promise<ResultadoPrueba> {
    return { ok: true, latenciaMs: 0, detalle: 'Siempre disponible; muestra los artículos recuperados sin redactar.' }
  }
}
