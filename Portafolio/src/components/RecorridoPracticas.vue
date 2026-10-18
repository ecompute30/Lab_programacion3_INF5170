<script setup lang="ts">
import { computed } from 'vue'
import { GraduationCap } from 'lucide-vue-next'
import type { Parada } from '../types/proyecto'

const { paradas } = defineProps<{ paradas: Parada[] }>()
const emit = defineEmits<{ ir: [clave: string] }>()

const practicas = computed(() => paradas.filter((p) => p.clave !== 'final'))
const completadas = computed(() => practicas.value.filter((p) => p.completada).length)
const finalPublicado = computed(() => paradas.some((p) => p.clave === 'final' && p.completada))
// La línea llena llega hasta la última parada completada.
const progreso = computed(() => {
  const ultima = paradas.findLastIndex((p) => p.completada)
  return paradas.length > 1 ? `${(Math.max(ultima, 0) / (paradas.length - 1)) * 100}%` : '0%'
})
</script>

<template>
  <nav class="recorrido" aria-label="Recorrido del curso">
    <div class="riel">
      <div class="pista" :style="{ '--progreso': progreso }">
        <span class="riel-base" aria-hidden="true" />
        <span class="riel-lleno" aria-hidden="true" />

        <ol class="paradas">
          <li
            v-for="(parada, indice) in paradas"
            :key="parada.clave"
            class="parada"
            :style="{ '--retraso': `${200 + indice * 55}ms` }"
          >
            <button
              type="button"
              class="punto"
              :class="{ completada: parada.completada, apagada: !parada.visible, final: parada.clave === 'final' }"
              :aria-label="parada.descripcion"
              :title="parada.descripcion"
              @click="emit('ir', parada.clave)"
            >
              <GraduationCap v-if="parada.clave === 'final'" :size="18" aria-hidden="true" />
              <span v-else>{{ parada.numero }}</span>
            </button>
          </li>
        </ol>
      </div>
    </div>
    <p class="leyenda">
      {{ completadas }} de {{ practicas.length }} prácticas completadas.
      {{ finalPublicado ? 'El proyecto final ya está publicado.' : 'El proyecto final cierra el recorrido.' }}
    </p>
  </nav>
</template>

<style scoped>
.recorrido {
  display: grid;
  gap: 0.9rem;
}

.riel {
  position: relative;
  overflow-x: auto;
  padding: 0.35rem 0.25rem;
  scrollbar-width: thin;
}

.pista {
  position: relative;
  min-width: 560px;
}

.riel-base,
.riel-lleno {
  position: absolute;
  left: 1.3rem;
  right: 1.3rem;
  top: 50%;
  height: 4px;
  margin-top: -2px;
  border-radius: 4px;
}

.riel-base {
  background-color: var(--borde);
}

.riel-lleno {
  background: linear-gradient(90deg, var(--azul-uasd), var(--azul-vivo));
  clip-path: inset(0 calc(100% - var(--progreso)) 0 0);
  animation: llenar 1100ms 150ms var(--ease-in-out) both;
}

.paradas {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.parada {
  animation: asomar 420ms var(--retraso) var(--ease-out) both;
}

.punto {
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  border: 2px solid var(--borde);
  background-color: var(--blanco);
  color: var(--tinta-suave);
  font-family: var(--fuente-titulos);
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 180ms var(--ease-out),
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    opacity 200ms ease;
}

.punto.completada {
  border-color: var(--azul-uasd);
  background-color: var(--azul-uasd);
  color: var(--blanco);
}

.punto.final {
  border-style: dashed;
  border-color: var(--dorado);
  color: var(--dorado);
  background-color: var(--dorado-suave);
}

.punto.apagada {
  opacity: 0.35;
}

.punto:hover {
  transform: translateY(-2px) scale(1.06);
}

.punto.completada:hover {
  background-color: var(--azul-tinta);
}

.punto:active {
  transform: scale(0.95);
}

.leyenda {
  color: var(--tinta-suave);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .riel {
    mask-image: linear-gradient(90deg, #000 85%, transparent);
  }

  .pista {
    min-width: 470px;
    margin-right: 1.5rem;
  }

  .punto {
    width: 2.1rem;
    height: 2.1rem;
    font-size: 0.8rem;
  }

  .riel-base,
  .riel-lleno {
    left: 1.05rem;
    right: 1.05rem;
  }
}

@keyframes llenar {
  from {
    clip-path: inset(0 100% 0 0);
  }
}

@keyframes asomar {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
}
</style>
