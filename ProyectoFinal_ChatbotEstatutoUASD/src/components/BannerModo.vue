<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CircleAlert, Info } from 'lucide-vue-next'
import { useConfiguracion } from '../composables/useConfiguracion'
import type { TrazaRespuesta } from '../composables/useChat'

const { traza, errorCorpus, esAdmin } = defineProps<{
  traza: TrazaRespuesta | null
  errorCorpus: string | null
  esAdmin: boolean
}>()

const { sinIA, estados } = useConfiguracion()

const aviso = computed<{ tipo: 'error' | 'info'; texto: string; configurable?: boolean } | null>(() => {
  if (errorCorpus) return { tipo: 'error', texto: `No se pudo cargar el Estatuto procesado: ${errorCorpus}` }
  if (sinIA.value) {
    return {
      tipo: 'error',
      texto: 'No hay un proveedor de inteligencia artificial configurado. Las respuestas mostrarán los artículos encontrados sin redactar.',
      configurable: true,
    }
  }
  if (traza && traza.intentosFallidos.length > 0) {
    const nombre = estados.value.find((e) => e.id === traza.proveedor)?.nombre ?? traza.proveedor
    const motivo = traza.intentosFallidos.map((i) => `${i.nombre}: ${i.error.message}`).join(' · ')
    return { tipo: 'info', texto: `La última respuesta la generó ${nombre} porque falló el proveedor principal (${motivo}).` }
  }
  return null
})
</script>

<template>
  <Transition name="aviso">
    <div v-if="aviso" class="aviso" :class="aviso.tipo" role="status">
      <CircleAlert v-if="aviso.tipo === 'error'" :size="17" aria-hidden="true" />
      <Info v-else :size="17" aria-hidden="true" />
      <span>{{ aviso.texto }}</span>
      <RouterLink v-if="aviso.configurable && esAdmin" :to="{ name: 'configuracion' }" class="enlace">Configurar</RouterLink>
    </div>
  </Transition>
</template>

<style scoped>
.aviso {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.75rem auto 0;
  width: min(100% - 2rem, var(--ancho-hilo));
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
}

.aviso.error {
  background-color: var(--rojo-suave);
  color: var(--rojo);
}

.aviso.info {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.enlace {
  margin-left: auto;
  font-weight: 600;
  color: inherit;
}

.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 200ms ease, transform 200ms var(--ease-out);
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
