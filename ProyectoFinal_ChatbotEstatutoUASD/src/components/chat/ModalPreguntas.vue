<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { TEMAS_SUGERIDOS } from '../../data/preguntasSugeridas'

const { abierto } = defineProps<{ abierto: boolean }>()
const emit = defineEmits<{ elegir: [texto: string]; cerrar: [] }>()

const botonCerrar = useTemplateRef<HTMLButtonElement>('botonCerrar')
let focoPrevio: HTMLElement | null = null

watch(
  () => abierto,
  async (valor) => {
    if (valor) {
      focoPrevio = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      await nextTick()
      botonCerrar.value?.focus()
    } else {
      document.body.style.overflow = ''
      focoPrevio?.focus()
    }
  },
)

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && abierto) emit('cerrar')
}

onMounted(() => document.addEventListener('keydown', alPresionarTecla))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', alPresionarTecla)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="abierto" class="fondo" @click.self="emit('cerrar')">
        <section class="panel" role="dialog" aria-modal="true" aria-labelledby="titulo-preguntas">
          <header class="cabecera">
            <div>
              <h2 id="titulo-preguntas" class="titulo">Preguntas sugeridas</h2>
              <p class="subtitulo">Temas del Estatuto Orgánico. Elija una para enviarla.</p>
            </div>
            <button ref="botonCerrar" type="button" class="cerrar" aria-label="Cerrar" @click="emit('cerrar')">
              <X :size="20" aria-hidden="true" />
            </button>
          </header>

          <div class="temas">
            <section v-for="tema in TEMAS_SUGERIDOS" :key="tema.id" class="tema">
              <h3 class="tema-titulo">{{ tema.nombre }}</h3>
              <ul class="preguntas">
                <li v-for="p in tema.preguntas" :key="p.texto">
                  <button type="button" class="pregunta" @click="emit('elegir', p.texto)">{{ p.texto }}</button>
                </li>
              </ul>
            </section>
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
  padding: 1rem;
  background-color: rgb(13 42 92 / 0.5);
  backdrop-filter: blur(3px);
}

.panel {
  width: min(100%, 820px);
  max-height: min(88dvh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--blanco);
  border-radius: 20px;
  box-shadow: var(--sombra-elevada);
}

.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0.9rem;
  border-bottom: 1px solid var(--borde);
}

.titulo {
  font-size: 1.3rem;
}

.subtitulo {
  font-size: 0.875rem;
  color: var(--tinta-suave);
}

.cerrar {
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border: 1px solid var(--borde);
  border-radius: 10px;
  background: none;
  color: var(--tinta);
  cursor: pointer;
}

.cerrar:hover {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.temas {
  overflow-y: auto;
  padding: 0.5rem 1.25rem 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 0.75rem 1.5rem;
  scrollbar-width: thin;
}

.tema-titulo {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--azul-uasd);
  padding: 0.9rem 0 0.4rem;
}

.preguntas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.2rem;
}

.pregunta {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: none;
  border-radius: 9px;
  background: none;
  color: var(--tinta);
  font-size: 0.92rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.pregunta:hover {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.modal-enter-active {
  transition: opacity 200ms var(--ease-out);
}

.modal-enter-active .panel {
  transition: transform 240ms var(--ease-out);
}

.modal-leave-active {
  transition: opacity 140ms ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .panel {
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 600px) {
  .fondo {
    padding: 0;
    align-items: end;
  }

  .panel {
    max-height: 92dvh;
    border-radius: 20px 20px 0 0;
  }
}
</style>
