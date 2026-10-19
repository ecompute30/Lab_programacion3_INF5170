<script setup lang="ts">
import { computed } from 'vue'
import type { Etapa } from '../../composables/useChat'

const { etapa } = defineProps<{ etapa: Etapa }>()
const texto = computed(() => (etapa === 'recuperando' ? 'Buscando en el Estatuto…' : 'Redactando…'))
</script>

<template>
  <div class="indicador" role="status" :aria-label="texto">
    <span class="monograma" aria-hidden="true">P</span>
    <div class="burbuja">
      <span class="puntos" aria-hidden="true"><i /><i /><i /></span>
      <span class="texto">{{ texto }}</span>
    </div>
  </div>
</template>

<style scoped>
.indicador {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.monograma {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background-color: var(--azul-uasd);
  color: var(--blanco);
  font-family: var(--fuente-titulos);
  font-weight: 700;
}

.burbuja {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.95rem;
  border-radius: 4px 16px 16px 16px;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  font-size: 0.85rem;
  color: var(--tinta-suave);
}

.puntos {
  display: inline-flex;
  gap: 4px;
}

.puntos i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--azul-uasd);
  animation: latir 1.1s ease-in-out infinite;
}

.puntos i:nth-child(2) {
  animation-delay: 0.15s;
}

.puntos i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes latir {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  30% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .monograma {
    display: none;
  }
}
</style>
