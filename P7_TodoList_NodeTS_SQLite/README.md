# Práctica 7 — Acceso a Base de Datos (Lista de Tareas)

Formulario web con CRUD completo (insertar, modificar, borrar y consultar registros) sobre una
base de datos relacional, construido con **Node.js + TypeScript + Express**, persistencia en
**SQLite** (vía [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)).

## Stack

- **Backend**: Node.js, TypeScript, Express 5.
- **Base de datos**: SQLite (archivo único `tareas.sqlite3`, creado automáticamente al arrancar).
- **Frontend**: HTML + CSS + JavaScript plano (sin framework), consumiendo la API REST vía `fetch`.

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
contra la API REST como manualmente en el navegador: agregar una tarea, marcarla como
completada, editarla (confirmando que el estado "completada" se conserva) y eliminarla.
