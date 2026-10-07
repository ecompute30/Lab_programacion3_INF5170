<script setup lang="ts">
import { ref } from 'vue'
import { useMenu } from '../composables/useMenu'

const { items, cargarDesdeJson, restaurarPorDefecto, mensajeError, limpiarError } = useMenu()

const textoJson = ref('')
const inputArchivo = ref<HTMLInputElement | null>(null)
const mensajeExito = ref('')

function notificarExito(texto: string) {
  mensajeExito.value = texto
  setTimeout(() => {
    mensajeExito.value = ''
  }, 2500)
}

async function manejarArchivo(evento: Event) {
  limpiarError()
  const archivo = (evento.target as HTMLInputElement).files?.[0]
  if (!archivo) return

  const texto = await archivo.text()
  if (cargarDesdeJson(texto)) {
    notificarExito(`Menú importado desde "${archivo.name}".`)
    textoJson.value = ''
  }
  if (inputArchivo.value) inputArchivo.value.value = ''
}

function importarDesdeTexto() {
  limpiarError()
  if (!textoJson.value.trim()) {
    return
  }
  if (cargarDesdeJson(textoJson.value)) {
    notificarExito('Menú importado desde el texto pegado.')
  }
}

function exportarJson() {
  const data = { menu: items.value }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'menu.json'
  enlace.click()
  URL.revokeObjectURL(url)
}

function restaurar() {
  restaurarPorDefecto()
  notificarExito('Se restauró el menú original.')
}
</script>

<template>
  <section class="importador-json">
    <h3>Importar / exportar estructura de menú</h3>
    <p class="texto-ayuda">
      Adjunta un archivo <code>.json</code> con el formato <code>{ "menu": [...] }</code>, o pega el JSON directamente.
    </p>

    <div class="campo-archivo">
      <label for="archivo-json">Adjuntar archivo JSON</label>
      <input id="archivo-json" ref="inputArchivo" type="file" accept="application/json,.json" @change="manejarArchivo">
    </div>

    <div class="campo-texto">
      <label for="texto-json">O pega el JSON aquí</label>
      <textarea
        id="texto-json"
        v-model="textoJson"
        rows="4"
        placeholder='{ "menu": [ { "id": 1, "nombre": "Inicio", "enlace": "/inicio" } ] }'
      />
      <button type="button" class="boton-secundario" @click="importarDesdeTexto">Importar texto</button>
    </div>

    <p v-if="mensajeError" class="mensaje-error" role="alert">{{ mensajeError }}</p>
    <p v-if="mensajeExito" class="mensaje-exito" role="status">{{ mensajeExito }}</p>

    <div class="acciones-json">
      <button type="button" class="boton-secundario" @click="exportarJson">Exportar menú actual</button>
      <button type="button" class="boton-secundario" @click="restaurar">Restaurar menú original</button>
    </div>
  </section>
</template>

<style scoped>
.importador-json {
  background-color: var(--blanco);
  border: 1px solid var(--gris-borde);
  border-radius: 10px;
  padding: 1.4rem 1.6rem;
}

.importador-json h3 {
  margin-top: 0;
  color: var(--azul-primario);
}

.texto-ayuda {
  font-size: 0.85rem;
  color: #4a5568;
}

.texto-ayuda code {
  background-color: var(--gris-claro);
  padding: 0.05rem 0.4rem;
  border-radius: 4px;
}

.campo-archivo,
.campo-texto {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.9rem;
}

.campo-archivo label,
.campo-texto label {
  font-size: 0.85rem;
  font-weight: 600;
}

.campo-texto textarea {
  padding: 0.6rem;
  border: 1px solid var(--gris-borde);
  border-radius: 6px;
  font-family: Consolas, monospace;
  font-size: 0.82rem;
  resize: vertical;
}

.campo-texto button {
  align-self: flex-start;
  margin-top: 0.4rem;
}

.mensaje-error {
  color: var(--rojo-error);
  background-color: #fbe9e7;
  border: 1px solid var(--rojo-error);
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
}

.mensaje-exito {
  color: #1b5e20;
  background-color: #e8f5e9;
  border: 1px solid #1b5e20;
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
}

.acciones-json {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.boton-secundario {
  background-color: var(--gris-claro);
  color: var(--azul-oscuro);
  border: 1px solid var(--gris-borde);
  border-radius: 30px;
  padding: 0.55rem 1.1rem;
  font-weight: bold;
  cursor: pointer;
}

.boton-secundario:hover {
  background-color: #e9edf5;
}
</style>
