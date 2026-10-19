// Imprime la línea VITE_GEMINI_API_KEY_B64 a partir de GEMINI_API_KEY (.env): `npm run clave:base64`.
const clave = process.env.GEMINI_API_KEY
if (!clave) {
  console.error('Falta GEMINI_API_KEY en .env')
  process.exit(1)
}
console.log('Pegue esta línea en .env y reinicie `npm run dev`:')
console.log(`VITE_GEMINI_API_KEY_B64=${Buffer.from(clave).toString('base64')}`)
