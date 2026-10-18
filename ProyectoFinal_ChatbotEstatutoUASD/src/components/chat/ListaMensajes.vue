<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import IndicadorEscribiendo from './IndicadorEscribiendo.vue'
import MensajeBurbuja from './MensajeBurbuja.vue'
import TrazaTecnica from './TrazaTecnica.vue'
import type { Etapa, TrazaRespuesta } from '../../composables/useChat'
import type { MensajeGuardado } from '../../services/conversacionesStorage'

const { mensajes, etapa, traza } = defineProps<{
  mensajes: MensajeGuardado[]
  etapa: Etapa
  traza: TrazaRespuesta | null
}>()

const emit = defineEmits<{
  verArticulo: [numero: number]
  reintentar: [mensaje: MensajeGuardado]
}>()

const contenedor = useTemplateRef<HTMLElement>('contenedor')
const pegadoAlFondo = shallowRef(true)

const ultimo = computed(() => mensajes.at(-1))
const esperandoPrimerTexto = computed(() => etapa !== null && ultimo.value?.rol === 'asistente' && !ultimo.value.contenido)
const idUltimaRespuesta = computed(() => [...mensajes].reverse().find((m) => m.rol === 'asistente' && !m.incompleto && !m.error)?.id)

function alDesplazar() {
  const el = contenedor.value
  if (!el) return
  pegadoAlFondo.value = el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

async function irAlFondo(suave = false) {
  await nextTick()
  const el = contenedor.value
  if (!el) return
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollTo({ top: el.scrollHeight, behavior: suave && !reducir ? 'smooth' : 'auto' })
}

// Mientras llega texto, el hilo sigue al final salvo que la persona haya subido a leer.
watch(
  () => [mensajes.length, ultimo.value?.contenido.length] as const,
  ([largo], anterior) => {
    if (pegadoAlFondo.value || largo !== anterior?.[0]) irAlFondo(largo !== anterior?.[0])
  },
)

onMounted(() => irAlFondo())
</script>

<template>
  <div ref="contenedor" class="lista" @scroll.passive="alDesplazar">
    <ol class="mensajes">
      <li v-for="mensaje in mensajes" :key="mensaje.id" class="entrada">
        <MensajeBurbuja :mensaje="mensaje" @ver-articulo="emit('verArticulo', $event)" @reintentar="emit('reintentar', mensaje)" />
        <TrazaTecnica v-if="traza && mensaje.id === idUltimaRespuesta" :traza="traza" />
      </li>
      <li v-if="esperandoPrimerTexto" class="entrada">
        <IndicadorEscribiendo :etapa="etapa" />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.lista {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.mensajes {
  list-style: none;
  margin: 0 auto;
  padding: 1.5rem clamp(0.9rem, 3vw, 1.5rem) 1rem;
  max-width: var(--ancho-hilo);
  display: grid;
  gap: 1.1rem;
}

.entrada {
  display: grid;
  gap: 0.5rem;
  animation: entrar 220ms var(--ease-out) both;
}

@keyframes entrar {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
