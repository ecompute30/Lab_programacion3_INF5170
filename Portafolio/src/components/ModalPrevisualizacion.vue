<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { ChevronLeft, ChevronRight, ExternalLink, LoaderCircle, X } from 'lucide-vue-next'
import { ICONOS } from './iconos'
import type { ElementoVista } from '../types/proyecto'

const { elemento, anterior = null, siguiente = null } = defineProps<{
  elemento: ElementoVista | null
  anterior?: ElementoVista | null
  siguiente?: ElementoVista | null
}>()

const emit = defineEmits<{
  cerrar: []
  navegar: [id: string]
}>()

const panel = useTemplateRef<HTMLElement>('panel')
const botonCerrar = useTemplateRef<HTMLButtonElement>('botonCerrar')
const cargando = shallowRef(true)
let focoPrevio: HTMLElement | null = null

const icono = computed(() => (elemento ? ICONOS[elemento.icono] : null))

watch(
  () => elemento?.url,
  async (url, urlAnterior) => {
    if (url) cargando.value = true
    if (url && !urlAnterior) {
      focoPrevio = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      botonCerrar.value?.focus()
    } else if (!url && urlAnterior) {
      document.body.style.overflow = ''
      focoPrevio?.focus()
    }
  },
)

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && elemento) emit('cerrar')
}

onMounted(() => document.addEventListener('keydown', alPresionarTecla))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', alPresionarTecla)
  document.body.style.overflow = ''
})

// Mantiene el foco del teclado dentro del modal mientras está abierto.
function atraparFoco(evento: KeyboardEvent) {
  if (!panel.value) return
  const enfocables = panel.value.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], iframe')
  const primero = enfocables[0]
  const ultimo = enfocables[enfocables.length - 1]
  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault()
    ultimo?.focus()
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault()
    primero?.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="elemento" class="fondo" @click.self="emit('cerrar')">
        <section
          ref="panel"
          class="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-vista"
          @keydown.tab="atraparFoco"
        >
          <header class="barra">
            <span class="icono" aria-hidden="true"><component :is="icono" :size="20" /></span>
            <div class="identidad">
              <span class="etiqueta">{{ elemento.etiqueta }}</span>
              <h2 id="titulo-vista" class="titulo">{{ elemento.titulo }}</h2>
            </div>

            <div class="controles">
              <button
                type="button"
                class="control"
                :disabled="!anterior"
                :title="anterior ? `Anterior: ${anterior.titulo}` : 'No hay anterior'"
                aria-label="Ver el proyecto anterior"
                @click="anterior && emit('navegar', anterior.id)"
              >
                <ChevronLeft :size="20" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="control"
                :disabled="!siguiente"
                :title="siguiente ? `Siguiente: ${siguiente.titulo}` : 'No hay siguiente'"
                aria-label="Ver el proyecto siguiente"
                @click="siguiente && emit('navegar', siguiente.id)"
              >
                <ChevronRight :size="20" aria-hidden="true" />
              </button>
              <a class="boton boton-secundario abrir" :href="elemento.url" target="_blank" rel="noopener noreferrer">
                <ExternalLink :size="16" aria-hidden="true" />
                <span class="abrir-texto">Abrir en pestaña nueva</span>
              </a>
              <button ref="botonCerrar" type="button" class="control cerrar" aria-label="Cerrar la previsualización" @click="emit('cerrar')">
                <X :size="20" aria-hidden="true" />
              </button>
            </div>
          </header>

          <div class="lienzo">
            <Transition name="carga">
              <div v-if="cargando" class="cargando" role="status">
                <LoaderCircle class="girando" :size="28" aria-hidden="true" />
                <span>Cargando {{ elemento.titulo }}…</span>
              </div>
            </Transition>
            <iframe
              :key="elemento.url"
              class="marco"
              :src="elemento.url"
              :title="`Previsualización de ${elemento.titulo}`"
              loading="eager"
              referrerpolicy="no-referrer"
              @load="cargando = false"
            />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fondo {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 2.5vh 2.5vw;
  background-color: rgb(13 42 92 / 0.55);
  backdrop-filter: blur(4px);
}

.panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--blanco);
  border-radius: 20px;
  box-shadow: 0 30px 80px rgb(13 42 92 / 0.35);
}

.barra {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 0.8rem 0.7rem 1rem;
  border-bottom: 1px solid var(--borde);
}

.icono {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 11px;
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.identidad {
  min-width: 0;
  display: grid;
  line-height: 1.25;
}

.etiqueta {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--azul-uasd);
}

.titulo {
  font-size: 1.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controles {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.control {
  display: grid;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--borde);
  border-radius: 10px;
  background-color: var(--blanco);
  color: var(--tinta);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease, transform 120ms var(--ease-out);
}

.control:hover:not(:disabled) {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.control:active:not(:disabled) {
  transform: scale(0.94);
}

.control:disabled {
  opacity: 0.4;
  cursor: default;
}

.cerrar:hover {
  background-color: var(--rojo-suave) !important;
  color: var(--rojo) !important;
}

.abrir {
  padding: 0.55rem 0.8rem;
  font-size: 0.875rem;
}

.lienzo {
  position: relative;
  flex: 1;
  background-color: var(--papel);
}

.marco {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background-color: var(--blanco);
}

.cargando {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.6rem;
  color: var(--tinta-suave);
  background-color: var(--papel);
}

.girando {
  color: var(--azul-uasd);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 220ms var(--ease-out);
}

.modal-enter-active .panel,
.modal-leave-active .panel {
  transition: transform 260ms var(--ease-out), opacity 220ms var(--ease-out);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .panel,
.modal-leave-to .panel {
  opacity: 0;
  transform: scale(0.96) translateY(12px);
}

.carga-leave-active {
  transition: opacity 240ms ease;
}

.carga-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .fondo {
    padding: 0;
  }

  .panel {
    border-radius: 0;
  }

  .abrir-texto {
    display: none;
  }
}
</style>
