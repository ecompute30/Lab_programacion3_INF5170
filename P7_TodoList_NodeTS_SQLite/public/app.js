const formulario = document.getElementById('formulario-tarea');
const campoId = document.getElementById('tarea-id');
const campoCompletada = document.getElementById('tarea-completada');
const campoTitulo = document.getElementById('tarea-titulo');
const campoDescripcion = document.getElementById('tarea-descripcion');
const tituloFormulario = document.getElementById('titulo-formulario');
const botonGuardar = document.getElementById('boton-guardar');
const botonCancelar = document.getElementById('boton-cancelar');
const listaTareas = document.getElementById('lista-tareas');
const mensajeVacio = document.getElementById('mensaje-vacio');
const mensajeError = document.getElementById('mensaje-error');

function mostrarError(texto) {
  mensajeError.textContent = texto;
  mensajeError.hidden = false;
}

function limpiarError() {
  mensajeError.hidden = true;
  mensajeError.textContent = '';
}

function entrarEnModoEdicion(tarea) {
  campoId.value = tarea.id;
  campoTitulo.value = tarea.titulo;
  campoDescripcion.value = tarea.descripcion;
  campoCompletada.value = String(Boolean(tarea.completada));
  tituloFormulario.textContent = `Editar tarea #${tarea.id}`;
  botonGuardar.textContent = 'Guardar cambios';
  botonCancelar.hidden = false;
  campoTitulo.focus();
}

function salirDeModoEdicion() {
  campoId.value = '';
  campoCompletada.value = 'false';
  formulario.reset();
  tituloFormulario.textContent = 'Agregar tarea';
  botonGuardar.textContent = 'Agregar tarea';
  botonCancelar.hidden = true;
}

function crearElementoTarea(tarea) {
  const li = document.createElement('li');
  li.className = 'tarea' + (tarea.completada ? ' completada' : '');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(tarea.completada);
  checkbox.addEventListener('change', () => alternarCompletada(tarea, checkbox.checked));

  const contenido = document.createElement('div');
  contenido.className = 'contenido';
  const h3 = document.createElement('h3');
  h3.textContent = tarea.titulo;
  const p = document.createElement('p');
  p.textContent = tarea.descripcion;
  contenido.append(h3, p);

  const acciones = document.createElement('div');
  acciones.className = 'acciones-tarea';

  const botonEditar = document.createElement('button');
  botonEditar.type = 'button';
  botonEditar.className = 'boton-secundario';
  botonEditar.textContent = 'Editar';
  botonEditar.addEventListener('click', () => entrarEnModoEdicion(tarea));

  const botonEliminar = document.createElement('button');
  botonEliminar.type = 'button';
  botonEliminar.className = 'boton-secundario';
  botonEliminar.textContent = 'Eliminar';
  botonEliminar.addEventListener('click', () => eliminarTarea(tarea));

  acciones.append(botonEditar, botonEliminar);
  li.append(checkbox, contenido, acciones);
  return li;
}

async function cargarTareas() {
  limpiarError();
  try {
    const respuesta = await fetch('/api/tareas');
    if (!respuesta.ok) throw new Error('No se pudieron cargar las tareas.');
    const tareas = await respuesta.json();

    listaTareas.innerHTML = '';
    mensajeVacio.hidden = tareas.length > 0;
    for (const tarea of tareas) {
      listaTareas.appendChild(crearElementoTarea(tarea));
    }
  } catch (error) {
    mostrarError(error.message);
  }
}

async function alternarCompletada(tarea, completada) {
  try {
    const respuesta = await fetch(`/api/tareas/${tarea.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: tarea.titulo, descripcion: tarea.descripcion, completada }),
    });
    if (!respuesta.ok) throw new Error('No se pudo actualizar la tarea.');
    await cargarTareas();
  } catch (error) {
    mostrarError(error.message);
  }
}

async function eliminarTarea(tarea) {
  if (!confirm(`¿Eliminar la tarea "${tarea.titulo}"?`)) return;
  try {
    const respuesta = await fetch(`/api/tareas/${tarea.id}`, { method: 'DELETE' });
    if (!respuesta.ok && respuesta.status !== 204) throw new Error('No se pudo eliminar la tarea.');
    if (campoId.value === String(tarea.id)) salirDeModoEdicion();
    await cargarTareas();
  } catch (error) {
    mostrarError(error.message);
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  limpiarError();

  const titulo = campoTitulo.value.trim();
  const descripcion = campoDescripcion.value.trim();
  if (!titulo) {
    mostrarError('El título es obligatorio.');
    return;
  }

  const idEnEdicion = campoId.value;
  const esEdicion = idEnEdicion !== '';

  try {
    const respuesta = await fetch(esEdicion ? `/api/tareas/${idEnEdicion}` : '/api/tareas', {
      method: esEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descripcion, completada: campoCompletada.value === 'true' }),
    });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      throw new Error(cuerpo.error || 'No se pudo guardar la tarea.');
    }

    salirDeModoEdicion();
    await cargarTareas();
  } catch (error) {
    mostrarError(error.message);
  }
});

botonCancelar.addEventListener('click', salirDeModoEdicion);

cargarTareas();
