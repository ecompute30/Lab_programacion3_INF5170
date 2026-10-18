<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarDays, CircleCheck, CodeXml, ExternalLink, Eye, GraduationCap, Hourglass, PencilLine } from 'lucide-vue-next'
import { estaPublicado } from '../services/proyectoFinalStorage'
import type { ProyectoFinal } from '../types/proyecto'

const { proyecto, puedeEditar = false } = defineProps<{
  proyecto: ProyectoFinal
  puedeEditar?: boolean
}>()

const emit = defineEmits<{ previsualizar: [] }>()

const publicado = computed(() => estaPublicado(proyecto))
const fechaLegible = computed(() => {
  if (!proyecto.fechaEntrega) return ''
  const fecha = new Date(`${proyecto.fechaEntrega}T12:00:00`)
  return Number.isNaN(fecha.getTime())
    ? ''
    : new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha)
})
</script>

<template>
  <article id="proyecto-final" class="final" :class="{ publicado }" aria-labelledby="titulo-proyecto-final">
    <span class="sello" aria-hidden="true">
      <GraduationCap :size="30" :stroke-width="1.6" />
    </span>

    <div class="contenido">
      <p class="estado" :class="{ 'estado-publicado': publicado }">
        <CircleCheck v-if="publicado" :size="16" aria-hidden="true" />
        <Hourglass v-else :size="16" aria-hidden="true" />
        {{ publicado ? 'Publicado' : 'En preparación' }}
      </p>
      <h2 id="titulo-proyecto-final" class="titulo">{{ proyecto.titulo }}</h2>
      <p class="resumen">{{ proyecto.resumen }}</p>

      <p v-if="fechaLegible" class="fecha">
        <CalendarDays :size="16" aria-hidden="true" /> Entrega prevista: {{ fechaLegible }}
      </p>

      <ul v-if="proyecto.tecnologias.length" class="tecnologias" aria-label="Tecnologías">
        <li v-for="tecnologia in proyecto.tecnologias" :key="tecnologia" class="tecnologia">{{ tecnologia }}</li>
      </ul>
    </div>

    <div class="acciones">
      <template v-if="publicado">
        <button type="button" class="boton boton-primario" @click="emit('previsualizar')">
          <Eye :size="17" aria-hidden="true" /> Previsualizar
        </button>
        <a class="boton boton-secundario" :href="proyecto.urlDemo" target="_blank" rel="noopener noreferrer">
          <ExternalLink :size="17" aria-hidden="true" /> Abrir
        </a>
      </template>
      <a
        v-if="proyecto.urlCodigo"
        class="boton boton-secundario"
        :href="proyecto.urlCodigo"
        target="_blank"
        rel="noopener noreferrer"
      >
        <CodeXml :size="17" aria-hidden="true" /> Código
      </a>
      <RouterLink v-if="puedeEditar" :to="{ name: 'admin' }" class="boton boton-fantasma">
        <PencilLine :size="17" aria-hidden="true" /> {{ publicado ? 'Editar datos' : 'Completar datos' }}
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.final {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.75rem 1.9rem;
  border: 2px dashed rgb(179 142 5 / 0.45);
  border-radius: 24px;
  background:
    radial-gradient(90% 140% at 100% 0%, var(--dorado-suave), transparent 70%),
    var(--blanco);
  scroll-margin-top: 6rem;
}

.final.publicado {
  border-style: solid;
  border-color: var(--azul-uasd);
  box-shadow: var(--sombra-elevada);
}

.sello {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background-color: var(--dorado-suave);
  color: var(--dorado);
}

.final.publicado .sello {
  background-color: var(--azul-uasd);
  color: var(--blanco);
}

.contenido {
  display: grid;
  gap: 0.45rem;
}

.estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  justify-self: start;
  padding: 0.15rem 0.65rem;
  border-radius: 999px;
  background-color: var(--dorado-suave);
  color: #7a6103;
  font-size: 0.8rem;
  font-weight: 600;
}

.estado-publicado {
  background-color: #e6f4ec;
  color: var(--verde);
}

.titulo {
  font-size: 1.5rem;
  letter-spacing: -0.01em;
}

.resumen {
  color: var(--tinta-suave);
  max-width: 62ch;
}

.fecha {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--tinta);
}

.tecnologias {
  list-style: none;
  margin: 0.2rem 0 0;
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
}

.acciones {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (max-width: 760px) {
  .final {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.4rem;
  }

  .acciones {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
