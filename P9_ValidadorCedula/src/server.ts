import path from 'node:path';
import express from 'express';
import { validarModulo10, soloDigitos } from './modulo10';

const app = express();
const PUERTO = Number(process.env.PORT) || 3001;

const URL_BASE_API_OFICIAL = 'https://api.digital.gob.do/v3/cedulas';

app.use(express.static(path.join(__dirname, '..', 'public')));

interface RespuestaApiOficial {
  valid: boolean;
}

async function consultarApiOficial(cedula: string): Promise<boolean | null> {
  try {
    const respuesta = await fetch(`${URL_BASE_API_OFICIAL}/${cedula}/validate`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!respuesta.ok) return null;
    const datos = (await respuesta.json()) as RespuestaApiOficial;
    return Boolean(datos.valid);
  } catch {
    // La API oficial no respondió a tiempo o no está disponible; el
    // resultado del algoritmo local (módulo 10) sigue siendo válido.
    return null;
  }
}

// GET /api/validar/:cedula — valida localmente (módulo 10) y, además,
// consulta la API oficial del gobierno dominicano como referencia.
// Se hace desde el servidor (no desde el navegador) porque la API oficial
// no envía cabeceras CORS y bloquearía la llamada si se hiciera en el cliente.
app.get('/api/validar/:cedula', async (req, res) => {
  const resultadoLocal = validarModulo10(req.params.cedula);

  if (!resultadoLocal.formatoValido) {
    res.status(400).json({ ...resultadoLocal, apiOficialValida: null });
    return;
  }

  const apiOficialValida = await consultarApiOficial(soloDigitos(resultadoLocal.cedula));
  res.json({ ...resultadoLocal, apiOficialValida });
});

app.listen(PUERTO, () => {
  console.log(`Validador de cédula escuchando en http://localhost:${PUERTO}`);
});
