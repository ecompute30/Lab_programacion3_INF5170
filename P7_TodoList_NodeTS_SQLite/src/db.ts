import path from 'node:path';
import Database from 'better-sqlite3';

/**
 * Práctica 7 — Acceso a Base de Datos.
 * Base de datos SQLite embebida (un único archivo en disco, sin servidor
 * aparte) con una tabla "tareas" para una aplicación de lista de tareas.
 */
const RUTA_BD = path.join(__dirname, '..', 'tareas.sqlite3');

export const db = new Database(RUTA_BD);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tareas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL DEFAULT '',
    completada INTEGER NOT NULL DEFAULT 0 CHECK (completada IN (0, 1)),
    creado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`);

export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string;
  completada: 0 | 1;
  creado_en: string;
}
