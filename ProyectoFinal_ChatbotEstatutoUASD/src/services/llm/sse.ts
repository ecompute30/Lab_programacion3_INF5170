/**
 * Lee un cuerpo de respuesta en formato Server-Sent Events y entrega el
 * campo `data` de cada evento ya parseado como JSON. Gemini y las APIs
 * compatibles con OpenAI usan este mismo transporte para el streaming.
 * Los eventos pueden venir separados por "\n\n" o por "\r\n\r\n".
 */
export async function* leerEventosSSE<T>(cuerpo: ReadableStream<Uint8Array>): AsyncGenerator<T> {
  const lector = cuerpo.getReader()
  const decodificador = new TextDecoder()
  let pendiente = ''

  function* extraer(bloque: string): Generator<T> {
    const datos = bloque
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('\n')
    if (datos && datos !== '[DONE]') yield JSON.parse(datos) as T
  }

  try {
    while (true) {
      const { value, done } = await lector.read()
      if (done) break
      pendiente += decodificador.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let separador: number
      while ((separador = pendiente.indexOf('\n\n')) !== -1) {
        const evento = pendiente.slice(0, separador)
        pendiente = pendiente.slice(separador + 2)
        yield* extraer(evento)
      }
    }
    pendiente += decodificador.decode()
    if (pendiente.trim()) yield* extraer(pendiente)
  } finally {
    lector.releaseLock()
  }
}
