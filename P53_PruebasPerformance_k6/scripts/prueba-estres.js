import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Práctica 5.3 — Prueba de ESTRÉS / BREAKPOINT con k6 sobre la Rick and Morty API.
 *
 * Objetivo: encontrar, de forma controlada, el punto en el que la API deja de
 * responder con éxito bajo concurrencia creciente. Se incrementa el número de
 * usuarios virtuales en escalones (2 → 4 → 6 → 8) para observar en qué momento
 * aparece el límite de solicitudes (HTTP 429) impuesto por Cloudflare frente a
 * la misma IP de origen.
 *
 * A diferencia de scripts/carga-moderada.js, aquí SÍ se espera encontrar
 * errores 429 en los escalones más altos: ese es precisamente el resultado
 * que se quiere observar y graficar (ver reportes/generar-grafico-estres.py).
 */

const BASE_URL = 'https://rickandmortyapi.com/api';

export const options = {
  scenarios: {
    prueba_estres: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 2 },
        { duration: '10s', target: 2 },
        { duration: '10s', target: 4 },
        { duration: '10s', target: 4 },
        { duration: '10s', target: 6 },
        { duration: '10s', target: 6 },
        { duration: '10s', target: 8 },
        { duration: '10s', target: 8 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  // No se definen thresholds estrictos: se espera que el error rate suba en
  // los escalones altos, eso es justamente lo que esta prueba busca medir.
};

export default function () {
  const res = http.get(`${BASE_URL}/character/1`, {
    tags: { endpoint: 'personaje_individual' },
  });
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
