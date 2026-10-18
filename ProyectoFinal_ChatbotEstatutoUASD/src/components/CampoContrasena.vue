<script setup lang="ts">
import { computed, shallowRef, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const { etiqueta, autocomplete = 'current-password', ayuda, id: idExterno } = defineProps<{
  id?: string
  etiqueta: string
  autocomplete?: 'current-password' | 'new-password'
  ayuda?: string
}>()

const valor = defineModel<string>({ required: true })
const visible = shallowRef(false)
const idGenerado = useId()
const id = computed(() => idExterno ?? idGenerado)
</script>

<template>
  <div class="campo">
    <label class="campo-etiqueta" :for="id">{{ etiqueta }}</label>
    <div class="contenedor">
      <input
        :id="id"
        v-model="valor"
        class="campo-entrada entrada"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :aria-describedby="ayuda ? `${id}-ayuda` : undefined"
        required
      >
      <button
        type="button"
        class="alternar"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" :size="18" aria-hidden="true" />
        <Eye v-else :size="18" aria-hidden="true" />
      </button>
    </div>
    <p v-if="ayuda" :id="`${id}-ayuda`" class="campo-ayuda">{{ ayuda }}</p>
  </div>
</template>

<style scoped>
.contenedor {
  position: relative;
}

.entrada {
  padding-right: 2.8rem;
}

.alternar {
  position: absolute;
  inset: 0 0.35rem 0 auto;
  margin: auto 0;
  height: 2.2rem;
  width: 2.2rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--tinta-suave);
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease;
}

.alternar:hover {
  color: var(--azul-uasd);
  background-color: var(--azul-niebla);
}
</style>
