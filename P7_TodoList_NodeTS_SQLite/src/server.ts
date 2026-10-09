import path from 'node:path';
import express, { Request, Response } from 'express';
import {
  listarTareas,
  obtenerTarea,
  crearTarea,
  actualizarTarea,
  borrarTarea,
} from './tareas.repositorio';

const app = express();
const PUERTO = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function parsearId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'El id debe ser un número entero positivo.' });
    return null;
  }
  return id;
}

// GET /api/tareas — consultar todas las tareas
app.get('/api/tareas', (_req, res) => {
  res.json(listarTareas());
});

// GET /api/tareas/:id — consultar una tarea
app.get('/api/tareas/:id', (req, res) => {
  const id = parsearId(req, res);
  if (id === null) return;

  const tarea = obtenerTarea(id);
  if (!tarea) {
    res.status(404).json({ error: `No existe una tarea con id ${id}.` });
    return;
  }
  res.json(tarea);
});

// POST /api/tareas — insertar una nueva tarea
app.post('/api/tareas', (req, res) => {
  const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
  const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';

  if (!titulo) {
    res.status(400).json({ error: 'El campo "titulo" es obligatorio.' });
    return;
  }

  const tarea = crearTarea(titulo, descripcion);
  res.status(201).json(tarea);
});

// PUT /api/tareas/:id — modificar una tarea existente
app.put('/api/tareas/:id', (req, res) => {
  const id = parsearId(req, res);
  if (id === null) return;

  const titulo = typeof req.body?.titulo === 'string' ? req.body.titulo.trim() : '';
  const descripcion = typeof req.body?.descripcion === 'string' ? req.body.descripcion.trim() : '';
  const completada = Boolean(req.body?.completada);

  if (!titulo) {
    res.status(400).json({ error: 'El campo "titulo" es obligatorio.' });
    return;
  }

  const tarea = actualizarTarea(id, titulo, descripcion, completada);
  if (!tarea) {
    res.status(404).json({ error: `No existe una tarea con id ${id}.` });
    return;
  }
  res.json(tarea);
});

// DELETE /api/tareas/:id — borrar una tarea
app.delete('/api/tareas/:id', (req, res) => {
  const id = parsearId(req, res);
  if (id === null) return;

  const borrada = borrarTarea(id);
  if (!borrada) {
    res.status(404).json({ error: `No existe una tarea con id ${id}.` });
    return;
  }
  res.status(204).send();
});

app.listen(PUERTO, () => {
  console.log(`Lista de tareas (SQLite) escuchando en http://localhost:${PUERTO}`);
});
