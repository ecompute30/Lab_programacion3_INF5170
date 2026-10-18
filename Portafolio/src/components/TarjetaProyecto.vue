<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CodeXml, ExternalLink, Eye } from 'lucide-vue-next'
import { ICONOS } from './iconos'
import { NOMBRES_CATEGORIA } from '../data/proyectos'
import { resaltar } from '../utils/resaltar'
import type { Proyecto } from '../types/proyecto'

const { proyecto, consulta = '', resaltada = false } = defineProps<{
  proyecto: Proyecto
  consulta?: string
  resaltada?: boolean
}>()

const emit = defineEmits<{ previsualizar: [proyecto: Proyecto] }>()

const icono = computed(() => ICONOS[proyecto.icono])
const segmentosTitulo = computed(() => resaltar(proyecto.titulo, consulta))
const idTitulo = computed(() => `titulo-${proyecto.id}`)
</script>

<template>
  <article
    :id="`proyecto-${proyecto.id}`"
    class="tarjeta"
    :class="{ resaltada }"
    :aria-labelledby="idTitulo"
  >
    <header class="cabecera">
      <span class="icono" aria-hidden="true">
        <component :is="icono" :size="22" :stroke-width="1.8" />
      </span>
      <div class="identidad">
        <span class="practica">Práctica {{ proyecto.practica }}</span>
        <span class="categoria">{{ NOMBRES_CATEGORIA[proyecto.categoria] }}</span>
      </div>
    </header>

    <h3 :id="idTitulo" class="titulo">
      <template v-for="(segmento, i) in segmentosTitulo" :key="i">
        <mark v-if="segmento.coincide" class="coincidencia">{{ segmento.texto }}</mark>
        <template v-else>{{ segmento.texto }}</template>
      </template>
    </h3>
    <p class="resumen">{{ proyecto.resumen }}</p>

    <ul class="tecnologias" aria-label="Tecnologías">
      <li v-for="tecnologia in proyecto.tecnologias" :key="tecnologia" class="tecnologia">{{ tecnologia }}</li>
    </ul>

    <footer class="acciones">
      <template v-if="proyecto.urlDemo">
        <button type="button" class="boton boton-primario accion-principal" @click="emit('previsualizar', proyecto)">
          <Eye :size="17" aria-hidden="true" /> Previsualizar
        </button>
        <a
          class="boton boton-secundario accion-icono"
          :href="proyecto.urlDemo"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${proyecto.etiquetaDemo} en una pestaña nueva`"
          :title="`${proyecto.etiquetaDemo} en una pestaña nueva`"
        >
          <ExternalLink :size="17" aria-hidden="true" />
        </a>
      </template>
      <p v-else-if="proyecto.nota" class="nota">
        <CircleCheck :size="17" aria-hidden="true" /> {{ proyecto.nota }}
      </p>
      <a
        v-if="proyecto.urlCodigo"
        class="boton boton-secundario accion-icono"
        :href="proyecto.urlCodigo"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver el código fuente en GitHub"
        title="Ver el código fuente en GitHub"
      >
        <CodeXml :size="17" aria-hidden="true" />
      </a>
    </footer>
  </article>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.35rem 1.35rem 1.2rem;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  box-shadow: var(--sombra-reposo);
  scroll-margin-top: 6rem;
  transition:
    transform 240ms var(--ease-out),
    box-shadow 240ms var(--ease-out),
    border-color 200ms ease;
}

@media (hover: hover) {
  .tarjeta:hover {
    transform: translateY(-3px);
    box-shadow: var(--sombra-elevada);
    border-color: #cfd9ea;
  }

  .tarjeta:hover .icono {
    background-color: var(--azul-uasd);
    color: var(--blanco);
    transform: rotate(-6deg);
  }
}

.tarjeta.resaltada {
  animation: destacar 1600ms var(--ease-out);
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.icono {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
  transition:
    background-color 220ms ease,
    color 220ms ease,
    transform 300ms var(--ease-out);
}

.identidad {
  display: grid;
  line-height: 1.3;
}

.practica {
  font-family: var(--fuente-titulos);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--azul-uasd);
}

.categoria {
  font-size: 0.8rem;
  color: var(--tinta-suave);
}

.titulo {
  font-size: 1.2rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.coincidencia {
  background-color: var(--dorado-suave);
  color: inherit;
  border-radius: 3px;
  box-shadow: 0 0 0 2px var(--dorado-suave);
}

.resumen {
  color: var(--tinta-suave);
  font-size: 0.94rem;
  max-width: 60ch;
}

.tecnologias {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tecnologia {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background-color: var(--papel);
  border: 1px solid var(--borde);
  font-size: 0.78rem;
  color: var(--tinta);
}

.acciones {
  margin-top: auto;
  padding-top: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.accion-principal {
  flex: 1;
}

.accion-icono {
  padding: 0.6rem;
}

.nota {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.875rem;
  color: var(--verde);
}

@keyframes destacar {
  0%,
  35% {
    border-color: var(--azul-uasd);
    box-shadow: 0 0 0 4px rgb(23 73 159 / 0.18), var(--sombra-elevada);
  }
}
</style>
