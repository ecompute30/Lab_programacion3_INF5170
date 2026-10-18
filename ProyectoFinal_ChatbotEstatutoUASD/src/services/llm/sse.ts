/**
 * Lee un cuerpo de respuesta en formato Server-Sent Events y entrega el
 * campo `data` de cada evento ya parseado como JSON. Gemini y las APIs
 * compatibles con OpenAI usan este mismo transporte para el streaming.
 */
export async function* leerEventosSSE<T>(cuerpo: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const lector = cuerpo.getReader()
  const decodificador = new TextDecoder()
  let pendiente = ''
  try {
    while (true) {
      const { value, done } = await lector.read()
      if (done) break
      pendiente += decodificador.decode(value, { stream: true })
      let separador: number
      while ((separador = pendiente.indexOf('\n\n')) !== -1) {
        const evento = pendiente.slice(0, separador)
        pendiente = pendiente.slice(separador + 2)
        const datos = evento
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('\n')
        if (!datos || datos === '[DONE]') continue
        yield JSON.parse(datos) as T
      }
    }
  } finally {
    lector.releaseLock()
  }
}
