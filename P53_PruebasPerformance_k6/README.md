# Práctica 5.3 — Pruebas de Performance con k6

Dos pruebas de rendimiento con **k6** sobre la [Rick and Morty API](https://rickandmortyapi.com/)
(API pública, sin autenticación): una de **carga moderada** dentro de límites seguros, y una de
**estrés** que explora deliberadamente hasta dónde aguanta la API antes de empezar a bloquear
solicitudes (rate limiting de Cloudflare, HTTP 429).

El reporte completo con el plan de prueba, resultados, gráficos y explicación está en
[`index.html`](index.html) (publicado también vía GitHub Pages).

## Estructura

```
scripts/
  carga-moderada.js   # ramping-vus 0→3 VUs, thresholds estrictos (p95<800ms, error<1%)
  prueba-estres.js     # ramping-vus en escalones 2→4→6→8 VUs, sin thresholds (se esperan errores)
reportes/
  carga-moderada.html/.json   # reporte HTML (k6-reporter) + JSON del resumen
  prueba-estres-metricas.json # NDJSON crudo exportado por k6 (--out json)
  generar-grafico-estres.py   # agrupa el NDJSON en ventanas de 5s y grafica VUs vs. % error
  grafico-estres.png          # gráfico resultante
capturas/              # capturas usadas en el reporte
index.html, styles.css # reporte consumible como página web (GitHub Pages)
```

## Hallazgo principal

La Rick and Morty API tolera de forma estable hasta ~4-5 solicitudes por segundo sostenidas
desde una misma IP. Por encima de ese umbral, Cloudflare responde `429` (`error code: 1015`)
con una cabecera `Retry-After`, en vez de degradarse gradualmente. Ver el detalle y el gráfico
en [`index.html`](index.html#prueba-estres).

## Cómo ejecutar

```bash
# Instalar k6: https://k6.io/docs/getting-started/installation/
k6 run scripts/carga-moderada.js
k6 run --out json=reportes/prueba-estres-metricas.json scripts/prueba-estres.js

# Regenerar el gráfico de la prueba de estrés
pip install matplotlib
python reportes/generar-grafico-estres.py
```
