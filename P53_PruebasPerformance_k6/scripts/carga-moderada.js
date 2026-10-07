import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

/**
 * Práctica 5.3 — Prueba de CARGA MODERADA con k6 sobre la Rick and Morty API
 * (https://rickandmortyapi.com/), una API pública y de solo lectura.
 *
 * El volumen de usuarios virtuales se mantuvo deliberadamente bajo (máx. 3 VUs,
 * con una pausa de 2s entre iteraciones) tras comprobar en una prueba de
 * diagnóstico que la API está protegida por Cloudflare y responde 429
 * ("Rate limited", código 1015) a partir de aproximadamente 5 solicitudes
 * por segundo sostenidas desde la misma IP. Ver scripts/prueba-estres.js
 * para la prueba que explora deliberadamente ese límite.
 */

const BASE_URL = 'https://rickandmortyapi.com/api';
const TOTAL_PERSONAJES = 826;
const TOTAL_PAGINAS = 42;

// 200 y 404 son respuestas "correctas": el 404 es un caso de prueba
// negativo deliberado (personaje inexistente), no una falla real.
http.setResponseCallback(http.expectedStatuses(200, 404));

const tasaErroresFuncionales = new Rate('errores_funcionales');
const duracionListado = new Trend('duracion_listado_personajes', true);
const duracionPersonaje = new Trend('duracion_personaje_individual', true);

export const options = {
  scenarios: {
    carga_moderada: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 2 }, // ramp-up: de 0 a 2 usuarios virtuales
        { duration: '15s', target: 2 }, // carga sostenida con 2 VUs
        { duration: '10s', target: 3 }, // pequeño incremento a 3 VUs
        { duration: '15s', target: 3 }, // carga sostenida con 3 VUs
        { duration: '10s', target: 0 }, // ramp-down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.01'],
    errores_funcionales: ['rate<0.01'],
  },
};

function registrarResultado(ok) {
  tasaErroresFuncionales.add(ok ? 0 : 1);
}

export default function () {
  // 1. Listado paginado de personajes (página aleatoria)
  const pagina = Math.floor(Math.random() * TOTAL_PAGINAS) + 1;
  const resListado = http.get(`${BASE_URL}/character?page=${pagina}`, {
    tags: { endpoint: 'listado_personajes' },
  });
  duracionListado.add(resListado.timings.duration);
  registrarResultado(
    check(resListado, {
      'listado: status 200': (r) => r.status === 200,
      'listado: contiene info.count': (r) => {
        try {
          return JSON.parse(r.body).info?.count > 0;
        } catch {
          return false;
        }
      },
    }),
  );

  // 2. Personaje individual aleatorio (existente)
  const idPersonaje = Math.floor(Math.random() * TOTAL_PERSONAJES) + 1;
  const resPersonaje = http.get(`${BASE_URL}/character/${idPersonaje}`, {
    tags: { endpoint: 'personaje_individual' },
  });
  duracionPersonaje.add(resPersonaje.timings.duration);
  registrarResultado(
    check(resPersonaje, {
      'personaje: status 200': (r) => r.status === 200,
      'personaje: tiene nombre': (r) => {
        try {
          return !!JSON.parse(r.body).name;
        } catch {
          return false;
        }
      },
    }),
  );

  // 3. Caso negativo deliberado: personaje inexistente debe responder 404
  const resInexistente = http.get(`${BASE_URL}/character/999999`, {
    tags: { endpoint: 'personaje_inexistente' },
  });
  registrarResultado(
    check(resInexistente, {
      'inexistente: status 404': (r) => r.status === 404,
    }),
  );

  sleep(2);
}

export function handleSummary(data) {
  return {
    'reportes/carga-moderada.html': htmlReport(data, { title: 'Práctica 5.3 — Carga moderada (Rick and Morty API)' }),
    'reportes/carga-moderada.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: false }),
  };
}
