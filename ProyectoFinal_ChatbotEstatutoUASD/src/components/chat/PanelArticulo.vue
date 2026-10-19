<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-vue-next'
import { cargarCorpus, urlPaginaPdf, type CorpusCargado } from '../../services/corpus'

const { numero } = defineProps<{ numero: number | null }>()
const emit = defineEmits<{ cerrar: []; navegar: [numero: number] }>()

const datos = shallowRef<CorpusCargado | null>(null)
const botonCerrar = useTemplateRef<HTMLButtonElement>('botonCerrar')
const cuerpo = useTemplateRef<HTMLElement>('cuerpo')
let focoPrevio: HTMLElement | null = null

const articulo = computed(() => (numero ? datos.value?.articuloPorNumero.get(numero) ?? null : null))
const capitulo = computed(() => (articulo.value ? datos.value?.capituloPorNumero.get(articulo.value.capitulo) ?? null : null))
const total = computed(() => datos.value?.corpus.articulos.length ?? 0)

watch(
  () => numero,
  async (n, anterior) => {
    if (n && !datos.value) datos.value = await cargarCorpus()
    if (n && !anterior) {
      focoPrevio = document.activeElement as HTMLElement | null
      await nextTick()
      botonCerrar.value?.focus()
    } else if (!n && anterior) {
      focoPrevio?.focus()
    }
    if (n) {
      await nextTick()
      cuerpo.value?.scrollTo({ top: 0 })
    }
  },
  { immediate: true },
)

function alPresionarTecla(evento: KeyboardEvent) {
  if (!numero) return
  if (evento.key === 'Escape') emit('cerrar')
  if (evento.key === 'ArrowLeft' && numero > 1) emit('navegar', numero - 1)
  if (evento.key === 'ArrowRight' && numero < total.value) emit('navegar', numero + 1)
}

onMounted(() => document.addEventListener('keydown', alPresionarTecla))
onBeforeUnmount(() => document.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <Teleport to="body">
    <Transition name="panel">
      <aside v-if="numero" class="panel" role="dialog" aria-modal="false" :aria-label="`Artículo ${numero} del Estatuto Orgánico`">
        <header class="cabecera">
          <div class="identidad">
            <p class="capitulo" v-if="capitulo">Capítulo {{ capitulo.romano }} · {{ capitulo.titulo }}</p>
            <h2 class="titulo">Artículo {{ numero }}</h2>
            <p v-if="articulo?.seccion" class="seccion">{{ articulo.seccion }}</p>
          </div>
          <button ref="botonCerrar" type="button" class="cerrar" aria-label="Cerrar el artículo" @click="emit('cerrar')">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <div ref="cuerpo" class="cuerpo">
          <p v-if="!datos" class="cargando">Cargando el Estatuto…</p>
          <p v-else-if="!articulo" class="cargando">El artículo {{ numero }} no existe en el Estatuto procesado.</p>
          <template v-else>
            <p v-for="(parrafo, i) in articulo.parrafos" :key="i" class="parrafo">{{ parrafo }}</p>
          </template>
        </div>

        <footer class="pie">
          <div class="navegacion">
            <button type="button" class="control" :disabled="numero <= 1" aria-label="Artículo anterior" @click="emit('navegar', numero - 1)">
              <ChevronLeft :size="18" aria-hidden="true" />
            </button>
            <span class="posicion">{{ numero }} / {{ total || '…' }}</span>
            <button type="button" class="control" :disabled="!total || numero >= total" aria-label="Artículo siguiente" @click="emit('navegar', numero + 1)">
              <ChevronRight :size="18" aria-hidden="true" />
            </button>
          </div>
          <a v-if="articulo" class="boton boton-secundario pdf" :href="urlPaginaPdf(articulo.pagina)" target="_blank" rel="noopener noreferrer">
            <ExternalLink :size="16" aria-hidden="true" /> Ver en el PDF oficial, pág. {{ articulo.pagina }}
          </a>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  width: min(100%, 520px);
  display: flex;
  flex-direction: column;
  background-color: var(--blanco);
  border-left: 1px solid var(--borde);
  box-shadow: -12px 0 40px rgb(13 42 92 / 0.18);
}

.cabecera {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem 0.9rem;
  border-bottom: 1px solid var(--borde);
  background:
    radial-gradient(80% 120% at 100% 0%, var(--dorado-suave), transparent 70%),
    var(--blanco);
}

.capitulo {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--azul-uasd);
}

.titulo {
  font-size: 1.6rem;
  letter-spacing: -0.02em;
}

.seccion {
  font-size: 0.85rem;
  color: var(--tinta-suave);
}

.cerrar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.3rem;
  border: 1px solid var(--borde);
  border-radius: 10px;
  background-color: var(--blanco);
  color: var(--tinta);
  cursor: pointer;
}

.cerrar:hover {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.cuerpo {
  flex: 1;
  overflow-y: auto;
  padding: 1.1rem 1.25rem;
  scrollbar-width: thin;
}

.parrafo {
  margin-bottom: 0.8rem;
  line-height: 1.65;
  max-width: 62ch;
}

.cargando {
  color: var(--tinta-suave);
}

.pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--borde);
}

.navegacion {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.control {
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid var(--borde);
  border-radius: 9px;
  background: none;
  color: var(--tinta);
  cursor: pointer;
}

.control:hover:not(:disabled) {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.control:disabled {
  opacity: 0.4;
  cursor: default;
}

.posicion {
  font-size: 0.82rem;
  color: var(--tinta-suave);
  font-variant-numeric: tabular-nums;
}

.pdf {
  font-size: 0.85rem;
  padding: 0.5rem 0.8rem;
}

.panel-enter-active {
  transition: transform 280ms var(--ease-out);
}

.panel-leave-active {
  transition: transform 200ms ease-in;
}

.panel-enter-from,
.panel-leave-to {
  transform: translateX(100%);
}
</style>
