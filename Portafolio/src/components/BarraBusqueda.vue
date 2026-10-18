<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { Clock, Search, X } from 'lucide-vue-next'
import { NOMBRES_CATEGORIA } from '../data/proyectos'
import type { Categoria } from '../types/proyecto'

const { conteoPorCategoria, recientes } = defineProps<{
  conteoPorCategoria: Partial<Record<Categoria, number>>
  recientes: string[]
}>()

const emit = defineEmits<{ olvidarRecientes: [] }>()

const consulta = defineModel<string>('consulta', { required: true })
const categoria = defineModel<Categoria | null>('categoria', { required: true })

const entrada = useTemplateRef<HTMLInputElement>('entrada')
const enfocada = shallowRef(false)

const opciones = computed(() => {
  const total = Object.values(conteoPorCategoria).reduce((suma, n) => suma + (n ?? 0), 0)
  return [
    { valor: null, nombre: 'Todas', cantidad: total },
    ...(Object.keys(NOMBRES_CATEGORIA) as Categoria[]).map((clave) => ({
      valor: clave,
      nombre: NOMBRES_CATEGORIA[clave],
      cantidad: conteoPorCategoria[clave] ?? 0,
    })),
  ]
})

const mostrarRecientes = computed(() => enfocada.value && consulta.value === '' && recientes.length > 0)

function borrarConsulta() {
  consulta.value = ''
  entrada.value?.focus()
}

function usarReciente(texto: string) {
  consulta.value = texto
  entrada.value?.focus()
}

// "/" enfoca la búsqueda desde cualquier parte, salvo mientras se escribe en otro campo.
function alPresionarTecla(evento: KeyboardEvent) {
  const objetivo = evento.target as HTMLElement
  const escribiendo = objetivo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(objetivo.tagName)
  if (evento.key === '/' && !escribiendo) {
    evento.preventDefault()
    entrada.value?.focus()
  }
}

function alSalir() {
  // Deja terminar el clic en una búsqueda reciente antes de ocultarlas.
  setTimeout(() => (enfocada.value = false), 120)
}

onMounted(() => document.addEventListener('keydown', alPresionarTecla))
onBeforeUnmount(() => document.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="barra" role="search">
    <div class="buscador">
      <Search class="icono-buscar" :size="19" aria-hidden="true" />
      <label for="busqueda-proyectos" class="sr-only">Buscar proyectos</label>
      <input
        id="busqueda-proyectos"
        ref="entrada"
        v-model="consulta"
        class="entrada"
        type="search"
        placeholder="Busca por nombre, tecnología o número de práctica"
        autocomplete="off"
        @focus="enfocada = true"
        @blur="alSalir"
        @keydown.esc="consulta = ''"
      >
      <button v-if="consulta" type="button" class="limpiar" aria-label="Borrar búsqueda" @click="borrarConsulta">
        <X :size="16" aria-hidden="true" />
      </button>
      <kbd v-else class="atajo" aria-hidden="true">/</kbd>

      <Transition name="recientes">
        <div v-if="mostrarRecientes" class="recientes">
          <div class="recientes-cabecera">
            <span>Búsquedas recientes</span>
            <button type="button" class="recientes-borrar" @click="emit('olvidarRecientes')">Borrar</button>
          </div>
          <button
            v-for="texto in recientes"
            :key="texto"
            type="button"
            class="reciente"
            @click="usarReciente(texto)"
          >
            <Clock :size="15" aria-hidden="true" /> {{ texto }}
          </button>
        </div>
      </Transition>
    </div>

    <div class="filtros" role="group" aria-label="Filtrar por tipo de proyecto">
      <button
        v-for="opcion in opciones"
        :key="opcion.valor ?? 'todas'"
        type="button"
        class="filtro"
        :class="{ activo: categoria === opcion.valor }"
        :aria-pressed="categoria === opcion.valor"
        :disabled="opcion.cantidad === 0 && categoria !== opcion.valor"
        @click="categoria = opcion.valor"
      >
        {{ opcion.nombre }}
        <span class="filtro-cantidad">{{ opcion.cantidad }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.barra {
  display: grid;
  gap: 0.85rem;
}

.buscador {
  position: relative;
  display: flex;
  align-items: center;
}

.icono-buscar {
  position: absolute;
  left: 1rem;
  color: var(--tinta-suave);
  pointer-events: none;
}

.entrada {
  width: 100%;
  padding: 0.85rem 3rem 0.85rem 2.9rem;
  border: 1px solid var(--borde);
  border-radius: 14px;
  background-color: var(--blanco);
  font-size: 1rem;
  box-shadow: var(--sombra-reposo);
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.entrada::-webkit-search-cancel-button {
  display: none;
}

.entrada:focus {
  outline: none;
  border-color: var(--azul-uasd);
  box-shadow: 0 0 0 4px rgb(23 73 159 / 0.14);
}

.atajo,
.limpiar {
  position: absolute;
  right: 0.75rem;
}

.atajo {
  padding: 0.1rem 0.45rem;
  border: 1px solid var(--borde);
  border-bottom-width: 2px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.8rem;
  color: var(--tinta-suave);
  background-color: var(--papel);
}

.limpiar {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border: none;
  border-radius: 8px;
  background-color: var(--papel);
  color: var(--tinta-suave);
  cursor: pointer;
}

.limpiar:hover {
  color: var(--azul-uasd);
  background-color: var(--azul-niebla);
}

.recientes {
  position: absolute;
  top: calc(100% + 0.4rem);
  left: 0;
  right: 0;
  z-index: 5;
  display: grid;
  padding: 0.4rem;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 14px;
  box-shadow: var(--sombra-elevada);
  transform-origin: top center;
}

.recientes-cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  color: var(--tinta-suave);
}

.recientes-borrar {
  border: none;
  background: none;
  color: var(--azul-uasd);
  font-size: 0.8rem;
  cursor: pointer;
}

.reciente {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.6rem;
  border: none;
  border-radius: 9px;
  background: none;
  text-align: left;
  cursor: pointer;
}

.reciente:hover {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.recientes-enter-active {
  transition: opacity 160ms var(--ease-out), transform 160ms var(--ease-out);
}

.recientes-leave-active {
  transition: opacity 100ms ease;
}

.recientes-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.recientes-leave-to {
  opacity: 0;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filtro {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.55rem 0.4rem 0.85rem;
  border: 1px solid var(--borde);
  border-radius: 999px;
  background-color: var(--blanco);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 120ms var(--ease-out);
}

.filtro:hover:not(:disabled) {
  border-color: var(--azul-uasd);
  color: var(--azul-uasd);
}

.filtro:active:not(:disabled) {
  transform: scale(0.96);
}

.filtro:disabled {
  opacity: 0.45;
  cursor: default;
}

.filtro.activo {
  background-color: var(--azul-uasd);
  border-color: var(--azul-uasd);
  color: var(--blanco);
}

.filtro-cantidad {
  min-width: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background-color: var(--papel);
  color: var(--tinta-suave);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.filtro.activo .filtro-cantidad {
  background-color: rgb(255 255 255 / 0.2);
  color: var(--blanco);
}
</style>
