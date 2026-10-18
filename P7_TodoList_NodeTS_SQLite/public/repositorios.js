/**
 * Capa de acceso a datos de la app. Expone dos implementaciones con la
 * misma interfaz (listar, crear, actualizar, borrar) para que app.js no
 * necesite saber si las tareas viven en el backend (SQLite) o en el
 * localStorage del navegador — el cambio es transparente para quien usa
 * la app.
 */

/**
 * Se lanza cuando la respuesta no tiene forma de venir de nuestra API (por
 * ejemplo, la página 404 en HTML que sirve GitHub Pages para una ruta que
 * no existe). Se distingue de un error real de la API —como "título
 * obligatorio"— que sí debe mostrarse al usuario tal cual.
 */
class ErrorSinBackend extends Error {}

async function leerJsonOFallar(respuesta, mensajePorDefecto) {
  const esJson = (respuesta.headers.get('content-type') || '').includes('application/json');
  if (!esJson) {
    throw new ErrorSinBackend('La respuesta no provino de la API esperada.');
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => ({}));
    throw new Error(cuerpo.error || mensajePorDefecto);
  }

  return respuesta.json();
}

const RepositorioApi = {
  async listar() {
    const respuesta = await fetch('/api/tareas');
    return leerJsonOFallar(respuesta, 'No se pudieron cargar las tareas.');
  },

  async crear({ titulo, descripcion }) {
    const respuesta = await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion }),
    });
    return leerJsonOFallar(respuesta, 'No se pudo guardar la tarea.');
  },

  async actualizar(id, { titulo, descripcion, completada }) {
    const respuesta = await fetch(`/api/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion, completada }),
    });
    return leerJsonOFallar(respuesta, 'No se pudo actualizar la tarea.');
  },

  async borrar(id) {
    const respuesta = await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
    if (respuesta.status === 204) return;
    await leerJsonOFallar(respuesta, 'No se pudo eliminar la tarea.');
  },
};

const CLAVE_LOCALSTORAGE = 'p7-todolist-tareas';
const CLAVE_LOCALSTORAGE_SIGUIENTE_ID = 'p7-todolist-siguiente-id';

function leerTareasLocales() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_LOCALSTORAGE)) || [];
  } catch {
    return [];
  }
}

function guardarTareasLocales(tareas) {
  localStorage.setItem(CLAVE_LOCALSTORAGE, JSON.stringify(tareas));
}

function siguienteIdLocal() {
  const actual = Number(localStorage.getItem(CLAVE_LOCALSTORAGE_SIGUIENTE_ID)) || 1;
  localStorage.setItem(CLAVE_LOCALSTORAGE_SIGUIENTE_ID, String(actual + 1));
  return actual;
}

const RepositorioLocalStorage = {
  async listar() {
    return [...leerTareasLocales()].sort((a, b) => b.id - a.id);
  },

  async crear({ titulo, descripcion }) {
    const tareas = leerTareasLocales();
    const nuevaTarea = {
      id: siguienteIdLocal(),
      titulo,
      descripcion: descripcion || '',
      completada: 0,
      creado_en: new Date().toISOString(),
    };
    tareas.push(nuevaTarea);
    guardarTareasLocales(tareas);
    return nuevaTarea;
  },

  async actualizar(id, { titulo, descripcion, completada }) {
    const tareas = leerTareasLocales();
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) throw new Error(`No existe una tarea con id ${id}.`);
    tarea.titulo = titulo;
    tarea.descripcion = descripcion || '';
    tarea.completada = completada ? 1 : 0;
    guardarTareasLocales(tareas);
    return tarea;
  },

  async borrar(id) {
    const tareas = leerTareasLocales().filter((t) => t.id !== id);
    guardarTareasLocales(tareas);
  },
};

/**
 * Detecta si un error viene de que el backend simplemente no existe en este
 * despliegue (p. ej. GitHub Pages), en vez de un error real de validación.
 */
function esErrorDeConexion(error) {
  return error instanceof TypeError || error instanceof ErrorSinBackend;
}

let repositorioActivo =
  window.APP_CONFIG?.storageMode === 'localStorage' ? RepositorioLocalStorage : RepositorioApi;
let yaAvisoCambioAModoLocal = false;

/**
 * Envuelve al repositorio activo: si está en modo "api" y el backend no
 * responde (no hay servidor, típico en un sitio estático), cambia de forma
 * transparente a localStorage para el resto de la sesión y lo informa una
 * única vez, sin interrumpir la operación que el usuario intentó hacer.
 */
export const repositorio = {
  async _conFallback(nombreOperacion, ...args) {
    try {
      return await repositorioActivo[nombreOperacion](...args);
    } catch (error) {
      if (repositorioActivo === RepositorioApi && esErrorDeConexion(error)) {
        repositorioActivo = RepositorioLocalStorage;
        if (!yaAvisoCambioAModoLocal) {
          yaAvisoCambioAModoLocal = true;
          console.warn(
            'No se pudo conectar con el backend; las tareas se guardarán en este navegador (localStorage).',
          );
        }
        return repositorioActivo[nombreOperacion](...args);
      }
      throw error;
    }
  },

  listar() {
    return this._conFallback('listar');
  },
  crear(datos) {
    return this._conFallback('crear', datos);
  },
  actualizar(id, datos) {
    return this._conFallback('actualizar', id, datos);
  },
  borrar(id) {
    return this._conFallback('borrar', id);
  },
  modoActivo() {
    return repositorioActivo === RepositorioApi ? 'api' : 'localStorage';
  },
};
