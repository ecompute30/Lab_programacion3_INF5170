# Práctica 7 — Acceso a Base de Datos (Lista de Tareas)

Formulario web con CRUD completo (insertar, modificar, borrar y consultar registros), construido
con **Node.js + TypeScript + Express**, persistencia en **SQLite** (vía
[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)).

## Dos modos de almacenamiento, transparentes para quien usa la app

Este CRUD requiere un backend para hablar con SQLite — algo que GitHub Pages no puede ejecutar
(solo sirve archivos estáticos). Para poder publicar un enlace navegable igual, el frontend
soporta **dos modos de guardado detrás de la misma interfaz**:

| Modo | Dónde se usa | Cómo se activa |
|------|--------------|-----------------|
| `api` | Ejecutando `npm run dev` / `npm start` localmente | Es el valor por defecto que sirve `src/server.ts` en la ruta `/config.js` (o lo que diga `STORAGE_MODE` en tu `.env`) |
| `localStorage` | **GitHub Pages** (sin backend) | Es el valor fijo guardado en [`public/config.js`](public/config.js), el único archivo que GitHub Pages puede servir tal cual |

La app en sí (`public/app.js`) nunca pregunta en qué modo está: llama siempre a las mismas
funciones de [`public/repositorios.js`](public/repositorios.js) (`listar`, `crear`, `actualizar`,
`borrar`). Además, si el modo activo es `api` pero el backend no responde (por ejemplo, si
alguien deja `config.js` en "api" en un despliegue estático), el repositorio lo detecta
automáticamente y cambia a `localStorage` para el resto de la sesión, avisando una sola vez con
un mensaje discreto — sin interrumpir lo que la persona estaba haciendo.

👉 **Demo en GitHub Pages** (modo `localStorage`, persiste solo en tu navegador):
https://ecompute30.github.io/Lab_programacion3_INF5170/P7_TodoList_NodeTS_SQLite/public/

## Stack

- **Backend**: Node.js, TypeScript, Express 5.
- **Base de datos**: SQLite (archivo único `tareas.sqlite3`, creado automáticamente al arrancar).
- **Frontend**: HTML + CSS + JavaScript plano (sin framework), módulos ES nativos (sin bundler).

## Modelo de datos

Tabla `tareas`: `id` (autoincremental), `titulo`, `descripcion`, `completada` (0/1), `creado_en`.

## Endpoints

| Método | Ruta | Acción |
|--------|------|--------|
| `GET` | `/api/tareas` | Consultar todas las tareas |
| `GET` | `/api/tareas/:id` | Consultar una tarea |
| `POST` | `/api/tareas` | Insertar una tarea nueva |
| `PUT` | `/api/tareas/:id` | Modificar una tarea existente |
| `DELETE` | `/api/tareas/:id` | Borrar una tarea |

## Cómo ejecutar

```bash
npm install
npm run dev     # modo desarrollo (recarga automática con tsx watch)
# o bien:
npm run build && npm start
```

Luego abre `http://localhost:3000` en el navegador. El formulario permite agregar, marcar como
completada (checkbox), editar y eliminar tareas; todos los cambios se guardan en
`tareas.sqlite3`.

## Verificación

Las cuatro operaciones (insertar, consultar, modificar, borrar) se probaron tanto por `curl`
contra la API REST como con un navegador real controlado por Playwright, en tres escenarios:

1. **Modo `api`** (backend Express corriendo): crear, editar y listar tareas vía SQLite.
2. **Modo `localStorage`** (sirviendo `public/` como archivos estáticos, sin backend): crear una
   tarea, recargar la página y confirmar que persiste leyendo el `localStorage` del navegador.
3. **Fallback automático**: forzando `config.js` a decir `"api"` sin que haya ningún backend
   real disponible — se confirmó que la app cae a `localStorage` sola, sin mostrar ningún error
   al usuario, y avisando por consola.
