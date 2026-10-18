# Práctica 9 — Servicios Web: Validador de Cédula Dominicana

Aplicación **100% cliente** (HTML + CSS + JavaScript plano, sin backend ni build step) que
valida una cédula dominicana con el **algoritmo del módulo 10** y, además, intenta
contrastarla en vivo con la [API oficial del gobierno dominicano](https://api.digital.gob.do/v3/cedulas/40225999348/validate)
directamente desde el navegador.

👉 **Demo en GitHub Pages**: https://ecompute30.github.io/Lab_programacion3_INF5170/P9_ValidadorCedula/

## Por qué ya no hay backend

Una primera versión de esta práctica usaba un pequeño servidor Node/TypeScript como *proxy*
hacia la API oficial, porque esa API no envía cabeceras CORS y un `fetch()` directo desde el
navegador sería bloqueado. Ese backend funcionaba, pero impedía publicar la app en GitHub Pages
(que solo sirve archivos estáticos).

La versión actual elimina el backend por completo:

1. El algoritmo del **módulo 10** corre enteramente en el navegador ([`modulo10.js`](modulo10.js))
   y es la fuente de verdad para decidir si la cédula es válida.
2. [`app.js`](app.js) **sí intenta** la llamada directa a la API oficial desde el cliente.
3. Si el navegador la bloquea por CORS (lo normal fuera de `api.digital.gob.do`), el error se
   captura y se muestra como una advertencia clara —
   *"API oficial: no disponible desde este navegador (bloqueada por CORS o sin conexión)"* —
   en vez de fallar o quedarse colgado. El resultado del algoritmo local sigue siendo el
   veredicto final de "válida / inválida".

Esto se comprobó con un navegador real (Playwright): al servir la app desde un origen distinto
a `api.digital.gob.do`, la consola muestra efectivamente el bloqueo de CORS
(`"has been blocked by CORS policy"`), y la app responde con el aviso y el resultado local
correcto, sin romperse.

## Algoritmo del módulo 10

Implementado en [`modulo10.js`](modulo10.js): cada uno de los primeros 10 dígitos se multiplica
alternadamente por 1 y 2 (si el producto tiene dos cifras, se suman sus dígitos); la suma total
determina el dígito verificador esperado, que se compara contra el dígito 11.

**Verificación empírica**: este algoritmo se probó contra la API oficial con 60 cédulas
construidas aleatoriamente (dígito verificador calculado localmente) — las 60 coincidieron
exactamente con el resultado de la API real, confirmando que la implementación es correcta.

## Cómo ejecutar

No requiere instalación. Basta con abrir [`index.html`](index.html) en el navegador, o servir
la carpeta con cualquier servidor estático:

```bash
python -m http.server 8080
# o: npx serve .
```
