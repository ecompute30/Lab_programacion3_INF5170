<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { MenuItem } from '../types/menu'
import { useMenu } from '../composables/useMenu'

const props = defineProps<{
  itemEnEdicion: MenuItem | null
}>()

const emit = defineEmits<{
  'cancelar-edicion': []
}>()

const { opcionesPlanas, agregarOpcion, actualizarOpcion, mensajeError, limpiarError } = useMenu()

const nombre = ref('')
const enlace = ref('')
const icono = ref('')
const padreId = ref<string>('')

const estaEditando = computed(() => props.itemEnEdicion !== null)

watch(
  () => props.itemEnEdicion,
  (item) => {
    limpiarError()
    if (item) {
      nombre.value = item.nombre
      enlace.value = item.enlace
      icono.value = item.icono ?? ''
    } else {
      nombre.value = ''
      enlace.value = ''
      icono.value = ''
      padreId.value = ''
    }
  },
  { immediate: true },
)

function limpiarFormulario() {
  nombre.value = ''
  enlace.value = ''
  icono.value = ''
  padreId.value = ''
}

function manejarEnvio() {
  if (estaEditando.value && props.itemEnEdicion) {
    const exito = actualizarOpcion(props.itemEnEdicion.id, nombre.value, enlace.value, icono.value)
    if (exito) {
      limpiarFormulario()
      emit('cancelar-edicion')
    }
    return
  }

  const idPadre = padreId.value ? Number(padreId.value) : null
  const exito = agregarOpcion(nombre.value, enlace.value, icono.value, idPadre)
  if (exito) limpiarFormulario()
}

function cancelar() {
  limpiarFormulario()
  emit('cancelar-edicion')
}
</script>

<template>
  <form class="formulario-menu" @submit.prevent="manejarEnvio">
    <h3>{{ estaEditando ? 'Editar opción de menú' : 'Agregar opción al menú' }}</h3>

    <div class="campo">
      <label for="campo-nombre">Nombre</label>
      <input id="campo-nombre" v-model="nombre" type="text" placeholder="Ej: Preguntas frecuentes" required>
    </div>

    <div class="campo">
      <label for="campo-enlace">Enlace</label>
      <input id="campo-enlace" v-model="enlace" type="text" placeholder="/faq o https://ejemplo.com" required>
    </div>

    <div class="campo">
      <label for="campo-icono">Icono (emoji, opcional)</label>
      <input id="campo-icono" v-model="icono" type="text" maxlength="2" placeholder="❓">
    </div>

    <div v-if="!estaEditando" class="campo">
      <label for="campo-padre">Colocar dentro de (submenú de):</label>
      <select id="campo-padre" v-model="padreId">
        <option value="">Nivel principal</option>
        <option v-for="opcion in opcionesPlanas" :key="opcion.id" :value="opcion.id">
          {{ opcion.etiqueta }}
        </option>
      </select>
    </div>

    <p v-if="mensajeError" class="mensaje-error" role="alert">{{ mensajeError }}</p>

    <div class="acciones-formulario">
      <button type="submit" class="boton-primario">
        {{ estaEditando ? 'Guardar cambios' : 'Agregar opción' }}
      </button>
      <button v-if="estaEditando" type="button" class="boton-secundario" @click="cancelar">
        Cancelar
      </button>
    </div>
  </form>
</template>

<style scoped>
.formulario-menu {
  background-color: var(--blanco);
  border: 1px solid var(--gris-borde);
  border-radius: 10px;
  padding: 1.4rem 1.6rem;
}

.formulario-menu h3 {
  margin-top: 0;
  color: var(--azul-primario);
}

.campo {
  margin-bottom: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.campo label {
  font-size: 0.85rem;
  font-weight: 600;
}

.campo input,
.campo select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--gris-borde);
  border-radius: 6px;
  font-family: inherit;
}

.mensaje-error {
  color: var(--rojo-error);
  background-color: #fbe9e7;
  border: 1px solid var(--rojo-error);
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
}

.acciones-formulario {
  display: flex;
  gap: 0.7rem;
}

.boton-primario,
.boton-secundario {
  border: none;
  border-radius: 30px;
  padding: 0.6rem 1.3rem;
  font-weight: bold;
  cursor: pointer;
}

.boton-primario {
  background-color: var(--azul-primario);
  color: var(--blanco);
}

.boton-primario:hover {
  background-color: var(--azul-brillante);
}

.boton-secundario {
  background-color: var(--gris-claro);
  color: var(--azul-oscuro);
  border: 1px solid var(--gris-borde);
}
</style>
