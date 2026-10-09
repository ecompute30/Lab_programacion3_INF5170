import { db, Tarea } from './db';

const sqlListar = db.prepare<[], Tarea>('SELECT * FROM tareas ORDER BY creado_en DESC, id DESC');
const sqlObtener = db.prepare<[number], Tarea>('SELECT * FROM tareas WHERE id = ?');
const sqlInsertar = db.prepare<[string, string]>(
  'INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)',
);
const sqlActualizar = db.prepare<[string, string, number, number]>(
  'UPDATE tareas SET titulo = ?, descripcion = ?, completada = ? WHERE id = ?',
);
const sqlBorrar = db.prepare<[number]>('DELETE FROM tareas WHERE id = ?');

export function listarTareas(): Tarea[] {
  return sqlListar.all();
}

export function obtenerTarea(id: number): Tarea | undefined {
  return sqlObtener.get(id);
}

export function crearTarea(titulo: string, descripcion: string): Tarea {
  const resultado = sqlInsertar.run(titulo, descripcion);
  return obtenerTarea(Number(resultado.lastInsertRowid))!;
}

export function actualizarTarea(
  id: number,
  titulo: string,
  descripcion: string,
  completada: boolean,
): Tarea | undefined {
  const resultado = sqlActualizar.run(titulo, descripcion, completada ? 1 : 0, id);
  if (resultado.changes === 0) return undefined;
  return obtenerTarea(id);
}

export function borrarTarea(id: number): boolean {
  const resultado = sqlBorrar.run(id);
  return resultado.changes > 0;
}
