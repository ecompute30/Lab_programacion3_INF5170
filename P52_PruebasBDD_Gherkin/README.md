# Práctica 5.2 — Pruebas BDD con Gherkin

Escenarios de comportamiento (BDD) escritos en **Gherkin** (`Dado/Cuando/Entonces`, en español)
sobre la gestión de opciones del **Menú Dinámico Uastiano** (Práctica 4, Vue 3 + TypeScript),
ejecutados automáticamente con **playwright-bdd**.

El reporte completo con la funcionalidad bajo prueba, el archivo `.feature`, qué valida cada
escenario, resultados y evidencia de ejecución está en [`index.html`](index.html) (publicado
también vía GitHub Pages).

> Nota: se usó `playwright-bdd` en lugar de documentar los escenarios solo como texto, para que
> cada escenario de Gherkin se ejecute como una prueba real de Playwright contra la aplicación
> en producción — reutilizando así la infraestructura de reportes de la Práctica 5.1.

## Estructura

```
features/menu-dinamico.feature   # 7 escenarios Gherkin (4 de éxito, 3 de error)
steps/menu-dinamico.steps.ts     # Definición de los pasos Given/When/Then
playwright.config.ts             # Config de playwright-bdd (defineBddConfig)
playwright-report/                # Reporte HTML interactivo de la última ejecución (evidencia)
capturas/                        # Capturas individuales usadas en el reporte
index.html, styles.css           # Reporte consumible como página web (GitHub Pages)
```

## Cómo ejecutar

```bash
npm install
npx playwright install chromium
npm test            # genera los tests desde los .feature (bddgen) y los ejecuta
npm run report       # abre el reporte HTML interactivo
```
