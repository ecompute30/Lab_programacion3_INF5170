<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { ArrowUp, PanelLeftOpen, Sparkles, Square } from 'lucide-vue-next'
import type { Etapa } from '../../composables/useChat'

const { enviando, etapa } = defineProps<{ enviando: boolean; etapa: Etapa }>()
const emit = defineEmits<{ enviar: [texto: string]; cancelar: []; abrirPanel: []; verSugeridas: [] }>()

const texto = shallowRef('')
const area = useTemplateRef<HTMLTextAreaElement>('area')
const MAX_CARACTERES = 1000

const puedeEnviar = computed(() => texto.value.trim().length > 0 && !enviando)
const estado = computed(() => (etapa === 'recuperando' ? 'Buscando en el Estatuto…' : etapa === 'redactando' ? 'Redactando la respuesta…' : ''))

function ajustarAltura() {
  const el = area.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`
}

watch(texto, ajustarAltura)

function enviar() {
  if (!puedeEnviar.value) return
  emit('enviar', texto.value)
  texto.value = ''
  area.value?.focus()
}

function alTeclear(evento: KeyboardEvent) {
  if (evento.key === 'Enter' && !evento.shiftKey && !evento.isComposing) {
    evento.preventDefault()
    enviar()
  }
  if (evento.key === 'Escape' && enviando) emit('cancelar')
}

defineExpose({ enfocar: () => area.value?.focus() })
</script>

<template>
  <div class="compositor">
    <form class="caja" :class="{ ocupado: enviando }" @submit.prevent="enviar">
      <button type="button" class="icono solo-movil" aria-label="Ver conversaciones" @click="emit('abrirPanel')">
        <PanelLeftOpen :size="20" aria-hidden="true" />
      </button>
      <button type="button" class="icono" aria-label="Ver preguntas sugeridas" title="Preguntas sugeridas" @click="emit('verSugeridas')">
        <Sparkles :size="20" aria-hidden="true" />
      </button>

      <label for="pregunta" class="sr-only">Escriba su pregunta sobre el Estatuto Orgánico</label>
      <textarea
        id="pregunta"
        ref="area"
        v-model="texto"
        class="area"
        rows="1"
        :maxlength="MAX_CARACTERES"
        placeholder="Pregunte sobre el Estatuto Orgánico…"
        autocomplete="off"
        @keydown="alTeclear"
      />

      <button v-if="enviando" type="button" class="enviar detener" aria-label="Detener la respuesta" title="Detener (Esc)" @click="emit('cancelar')">
        <Square :size="16" aria-hidden="true" />
      </button>
      <button v-else type="submit" class="enviar" :disabled="!puedeEnviar" aria-label="Enviar pregunta" title="Enviar (Enter)">
        <ArrowUp :size="20" aria-hidden="true" />
      </button>
    </form>

    <p class="ayuda" aria-live="polite">
      <span v-if="estado" class="estado">{{ estado }}</span>
      <span v-else>Primada responde solo con el Estatuto Orgánico y cita los artículos. Enter envía; Shift + Enter cambia de línea.</span>
    </p>
  </div>
</template>

<style scoped>
.compositor {
  padding: 0.5rem clamp(0.9rem, 3vw, 1.5rem) calc(0.75rem + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--papel) 70%, transparent);
}

.caja {
  max-width: var(--ancho-hilo);
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  padding: 0.4rem 0.4rem 0.4rem 0.5rem;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 18px;
  box-shadow: var(--sombra-reposo);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.caja:focus-within {
  border-color: var(--azul-uasd);
  box-shadow: 0 0 0 4px rgb(23 73 159 / 0.12);
}

.icono {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--tinta-suave);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.icono:hover {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.solo-movil {
  display: none;
}

.area {
  flex: 1;
  min-height: 2.4rem;
  max-height: 180px;
  padding: 0.6rem 0.4rem;
  border: none;
  background: none;
  resize: none;
  font-size: 1rem;
  line-height: 1.45;
  outline: none;
}

.enviar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  border-radius: 12px;
  background-color: var(--azul-uasd);
  color: var(--blanco);
  cursor: pointer;
  transition: background-color 140ms ease, transform 120ms var(--ease-out), opacity 140ms ease;
}

.enviar:hover:not(:disabled) {
  background-color: var(--azul-tinta);
}

.enviar:active:not(:disabled) {
  transform: scale(0.94);
}

.enviar:disabled {
  opacity: 0.35;
  cursor: default;
}

.detener {
  background-color: var(--tinta);
}

.ayuda {
  max-width: var(--ancho-hilo);
  margin: 0.45rem auto 0;
  padding: 0 0.5rem;
  font-size: 0.76rem;
  color: var(--tinta-suave);
  text-align: center;
  min-height: 1.2em;
}

.estado {
  color: var(--azul-uasd);
  font-weight: 500;
}

@media (max-width: 900px) {
  .solo-movil {
    display: grid;
  }
}

@media (max-width: 600px) {
  .ayuda span:not(.estado) {
    display: none;
  }
}
</style>
