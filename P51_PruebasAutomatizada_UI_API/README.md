# Práctica 5.1 — Pruebas Automatizadas de UI y API

Suite de pruebas end-to-end con **Playwright + TypeScript** que valida:

- La interfaz del **Menú Dinámico Uastiano** (Práctica 4, Vue 3 + TypeScript):
  https://ecompute30.github.io/Lab_programacion3_INF5170/P4_MenuDinamico_Vue/dist/
- La API pública **JSONPlaceholder** (sin autenticación): https://jsonplaceholder.typicode.com

El reporte completo con objetivo, casos de prueba, resultados, capturas y hallazgos está en
[`index.html`](index.html) (publicado también vía GitHub Pages).

> Nota: la Countries API sugerida en la guía (`restcountries.com` v3.1) está deprecada y su
> reemplazo (v5) exige una cabecera `Authorization: Bearer`. Se optó por JSONPlaceholder por
> ser pública, estable y sin autenticación — ver el detalle en el reporte.

## Estructura

```
tests/
  ui/menu-dinamico.spec.ts     # 6 casos de UI (carga, navegación, submenús, formularios, responsive)
  api/jsonplaceholder.spec.ts  # 4 casos de API (200, 404, 201, validación de JSON)
playwright-report/             # Reporte HTML interactivo de la última ejecución (evidencia)
capturas/                      # Capturas de pantalla individuales usadas en el reporte
index.html, styles.css         # Reporte consumible como página web (GitHub Pages)
```

## Cómo ejecutar

```bash
npm install
npx playwright install chromium
npm test                 # ejecuta las 10 pruebas (UI + API)
npm run test:ui          # solo las pruebas de UI
npm run test:api         # solo las pruebas de API
npm run report           # abre el reporte HTML interactivo
```
