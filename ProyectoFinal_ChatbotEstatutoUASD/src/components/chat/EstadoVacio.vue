<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookMarked } from 'lucide-vue-next'
import { PREGUNTAS_DESTACADAS, PREGUNTAS_SUGERIDAS } from '../../data/preguntasSugeridas'

const { nombre } = defineProps<{ nombre: string }>()
const emit = defineEmits<{ preguntar: [texto: string]; verTodas: [] }>()

const saludo = computed(() => {
  const hora = new Date().getHours()
  const momento = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'
  const primerNombre = nombre.split(' ')[0]
  return primerNombre ? `${momento}, ${primerNombre}.` : `${momento}.`
})
</script>

<template>
  <div class="vacio">
    <div class="interior">
      <span class="sello" aria-hidden="true"><BookMarked :size="26" :stroke-width="1.8" /></span>
      <p class="saludo">{{ saludo }}</p>
      <h1 class="titulo">¿Qué desea consultar del Estatuto Orgánico?</h1>
      <p class="descripcion">
        Primada busca en los 146 artículos del Estatuto, redacta una respuesta breve y le indica el artículo que la
        respalda. Puede empezar con una de estas preguntas.
      </p>

      <ul class="sugeridas" aria-label="Preguntas sugeridas">
        <li v-for="(pregunta, i) in PREGUNTAS_DESTACADAS" :key="pregunta.texto" :style="{ '--retraso': `${120 + i * 45}ms` }">
          <button type="button" class="sugerida" @click="emit('preguntar', pregunta.texto)">
            <span>{{ pregunta.texto }}</span>
            <ArrowRight class="flecha" :size="16" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <button type="button" class="boton boton-fantasma todas" @click="emit('verTodas')">
        Ver las {{ PREGUNTAS_SUGERIDAS.length }} preguntas por tema
      </button>
    </div>
  </div>
</template>

<style scoped>
.vacio {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  place-items: center;
  padding: 1.5rem clamp(0.9rem, 3vw, 1.5rem);
}

.interior {
  width: min(100%, 640px);
  display: grid;
  justify-items: start;
  gap: 0.6rem;
  animation: aparecer 500ms var(--ease-out) both;
}

.sello {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background-color: var(--azul-uasd);
  color: var(--blanco);
  margin-bottom: 0.4rem;
}

.saludo {
  color: var(--tinta-suave);
  font-size: 1rem;
}

.titulo {
  font-size: clamp(1.6rem, 3.6vw, 2.2rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  max-width: 20ch;
}

.descripcion {
  color: var(--tinta-suave);
  max-width: 56ch;
  margin-bottom: 0.8rem;
}

.sugeridas {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 0.55rem;
}

.sugeridas li {
  animation: aparecer 420ms var(--retraso) var(--ease-out) both;
}

.sugerida {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.8rem 0.95rem;
  border: 1px solid var(--borde);
  border-radius: 14px;
  background-color: var(--blanco);
  color: var(--tinta);
  font-size: 0.93rem;
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, transform 180ms var(--ease-out), box-shadow 180ms var(--ease-out);
}

.sugerida .flecha {
  flex-shrink: 0;
  color: var(--tinta-suave);
  transition: transform 180ms var(--ease-out), color 160ms ease;
}

@media (hover: hover) {
  .sugerida:hover {
    border-color: var(--azul-uasd);
    transform: translateY(-1px);
    box-shadow: var(--sombra-reposo);
  }

  .sugerida:hover .flecha {
    transform: translateX(3px);
    color: var(--azul-uasd);
  }
}

.todas {
  margin-top: 0.3rem;
  margin-left: -0.5rem;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
