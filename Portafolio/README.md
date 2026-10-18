# Portafolio de prácticas — INF-5170

SPA en **Vue 3 + TypeScript + Vue Router** que reúne todas las prácticas del Laboratorio de
Programación III en un solo lugar: se pueden buscar, filtrar y previsualizar sin salir del
portafolio. No hay backend: todo (cuentas, sesión, catálogo, índice de búsqueda y datos del
proyecto final) vive en el `localStorage` del navegador.

👉 **En línea**: https://ecompute30.github.io/Lab_programacion3_INF5170/Portafolio/dist/

## Acceso

| Usuario       | Contraseña inicial | Rol           | Puede                                                    |
|---------------|--------------------|---------------|----------------------------------------------------------|
| `mconcepcion` | `12345`            | Revisor       | Ver y previsualizar prácticas, cambiar su contraseña     |
| `admin`       | `admin`            | Administrador | Lo anterior + completar el proyecto final y restablecer contraseñas |

La autenticación es simulada, pero se comporta como una real ([`src/services/authStorage.ts`](src/services/authStorage.ts)):

- Las contraseñas no se guardan en texto plano: se derivan con **PBKDF2-SHA-256** (120 000
  iteraciones) y sal aleatoria por cuenta, usando la Web Crypto API.
- La sesión tiene token aleatorio y **vence a las 8 horas**; el router la revisa en cada navegación.
- Tras **5 intentos fallidos** la cuenta se bloquea 60 segundos.
- La comparación del hash es en tiempo constante y un usuario inexistente tarda lo mismo que uno
  con contraseña incorrecta, para no revelar qué cuentas existen.

> Al ser 100% cliente, esto es una simulación didáctica: cualquiera con acceso al navegador puede
> leer o borrar el `localStorage`. Si `mconcepcion` olvida su contraseña, `admin` puede
> restablecerla desde **Administración**.

## Funcionalidades

- **Recorrido del curso**: línea de la práctica 0 a la 10 más el proyecto final; cada parada lleva
  a su tarjeta y la resalta.
- **Búsqueda indexada** ([`src/services/catalogoStorage.ts`](src/services/catalogoStorage.ts)): el
  catálogo se indexa una vez por versión y se guarda en `localStorage`. La búsqueda ignora tildes y
  mayúsculas, acepta prefijos ("play" encuentra Playwright) y ordena por relevancia (título >
  tecnología/número de práctica > categoría > resumen). Las búsquedas recientes se guardan por usuario.
  Atajo: tecla `/`.
- **Filtros por tipo**: sitios web, aplicaciones, pruebas, teoría y presentaciones, con conteo.
- **Previsualización**: un iframe que cubre casi toda la pantalla, con botones anterior/siguiente,
  "Abrir en pestaña nueva" y cierre con `Esc`.
- **Proyecto final (mock)**: aparece "En preparación" hasta que tenga URL de demo. Los datos se
  completan en [`src/data/proyectoFinal.ts`](src/data/proyectoFinal.ts) o desde la vista de
  Administración (que solo acepta enlaces `http(s)`).

## Agregar o cambiar una práctica

Editar [`src/data/proyectos.ts`](src/data/proyectos.ts) e incrementar `VERSION_CATALOGO` para que
los navegadores vuelvan a indexar el catálogo.

## Cómo ejecutar

```bash
npm install
npm run dev      # desarrollo
npm run build    # genera dist/ (lo que publica GitHub Pages)
```

Se usa `createWebHashHistory` porque GitHub Pages solo sirve archivos estáticos y no reescribe rutas.

## Verificación

Probado en Chromium con Playwright (23 comprobaciones, sin errores de consola): redirección al login
sin sesión, error y bloqueo por intentos fallidos, búsqueda sin tildes, filtros, estado vacío,
persistencia del índice y de las búsquedas recientes, recorrido, previsualización y navegación entre
proyectos, acceso a `/admin` denegado al revisor, cambio y restablecimiento de contraseña, rechazo de
URL `javascript:`, publicación del proyecto final y vista móvil.
