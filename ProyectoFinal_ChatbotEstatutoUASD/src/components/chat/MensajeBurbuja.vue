<script setup lang="ts">
import { computed } from 'vue'
import { CircleAlert, RotateCcw } from 'lucide-vue-next'
import type { MensajeGuardado } from '../../services/conversacionesStorage'
import { renderizarMarkdown } from '../../utils/markdown'

const { mensaje } = defineProps<{ mensaje: MensajeGuardado }>()
const emit = defineEmits<{ verArticulo: [numero: number]; reintentar: [] }>()

const esUsuario = computed(() => mensaje.rol === 'usuario')
const html = computed(() => (esUsuario.value ? '' : renderizarMarkdown(mensaje.contenido)))

const NOMBRES_PROVEEDOR: Record<string, string> = { gemini: 'Gemini', groq: 'Groq', extractivo: 'Búsqueda sin IA' }
const pie = computed(() => {
  if (esUsuario.value || mensaje.incompleto || !mensaje.proveedor) return null
  const partes = [NOMBRES_PROVEEDOR[mensaje.proveedor] ?? mensaje.proveedor]
  if (mensaje.modelo && mensaje.proveedor !== 'extractivo') partes.push(mensaje.modelo)
  if (mensaje.duracionMs) partes.push(`${(mensaje.duracionMs / 1000).toFixed(1).replace('.', ',')} s`)
  return partes.join(' · ')
})

const articulosConsultados = computed(() => {
  const numeros = new Set<number>()
  for (const f of mensaje.fragmentos ?? []) if (f.articulo) numeros.add(f.articulo)
  return [...numeros].sort((a, b) => a - b)
})

function alHacerClic(evento: MouseEvent) {
  const boton = (evento.target as HTMLElement).closest<HTMLElement>('[data-articulo]')
  const numero = Number(boton?.dataset.articulo)
  if (numero) emit('verArticulo', numero)
}
</script>

<template>
  <article class="mensaje" :class="esUsuario ? 'usuario' : 'asistente'" :aria-label="esUsuario ? 'Su pregunta' : 'Respuesta de Primada'">
    <span v-if="!esUsuario" class="monograma" aria-hidden="true">P</span>

    <div class="cuerpo">
      <p v-if="esUsuario" class="texto-usuario">{{ mensaje.contenido }}</p>

      <template v-else>
        <div
          v-if="html"
          class="contenido-markdown"
          :class="{ escribiendo: mensaje.incompleto }"
          @click="alHacerClic"
          v-html="html"
        />

        <div v-if="mensaje.error" class="error" role="alert">
          <CircleAlert :size="18" aria-hidden="true" />
          <span>{{ mensaje.error }}</span>
          <button type="button" class="boton boton-secundario reintentar" @click="emit('reintentar')">
            <RotateCcw :size="15" aria-hidden="true" /> Reintentar
          </button>
        </div>

        <footer v-if="pie || articulosConsultados.length" class="pie">
          <span v-if="pie" class="pie-fuente">{{ pie }}</span>
          <span v-if="articulosConsultados.length" class="pie-articulos">
            <span class="pie-etiqueta">Artículos consultados:</span>
            <button
              v-for="n in articulosConsultados"
              :key="n"
              type="button"
              class="chip chip-boton"
              :title="`Ver el artículo ${n}`"
              @click="emit('verArticulo', n)"
            >
              Art. {{ n }}
            </button>
          </span>
        </footer>
      </template>
    </div>
  </article>
</template>

<style scoped>
.mensaje {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.mensaje.usuario {
  justify-content: flex-end;
}

.monograma {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin-top: 0.15rem;
  border-radius: 10px;
  background-color: var(--azul-uasd);
  color: var(--blanco);
  font-family: var(--fuente-titulos);
  font-weight: 700;
}

.cuerpo {
  min-width: 0;
  max-width: 100%;
}

.usuario .cuerpo {
  max-width: 80%;
  padding: 0.7rem 1rem;
  border-radius: 18px 18px 4px 18px;
  background-color: var(--azul-uasd);
  color: var(--blanco);
}

.texto-usuario {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.asistente .cuerpo {
  flex: 1;
  padding: 1rem 1.2rem;
  border-radius: 4px 18px 18px 18px;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  box-shadow: var(--sombra-reposo);
  overflow-wrap: anywhere;
}

.contenido-markdown {
  line-height: 1.6;
}

/* Cursor al final mientras llega la respuesta: señal de que sigue escribiendo. */
.contenido-markdown.escribiendo > :last-child::after {
  content: '';
  display: inline-block;
  width: 0.55em;
  height: 1em;
  margin-left: 0.15em;
  vertical-align: text-bottom;
  background-color: var(--azul-uasd);
  border-radius: 2px;
  animation: parpadeo 900ms steps(2, start) infinite;
}

.error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background-color: var(--rojo-suave);
  color: var(--rojo);
  font-size: 0.9rem;
}

.reintentar {
  margin-left: auto;
  padding: 0.35rem 0.7rem;
  font-size: 0.82rem;
}

.pie {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.9rem;
  margin-top: 0.85rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--borde);
  font-size: 0.78rem;
  color: var(--tinta-suave);
}

.pie-articulos {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
}

.pie-etiqueta {
  margin-right: 0.2rem;
}

.chip-boton {
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease;
}

.chip-boton:hover {
  background-color: var(--azul-niebla);
  border-color: rgb(23 73 159 / 0.3);
  color: var(--azul-uasd);
}

@keyframes parpadeo {
  to {
    opacity: 0;
  }
}

@media (max-width: 600px) {
  .monograma {
    display: none;
  }

  .usuario .cuerpo {
    max-width: 92%;
  }
}
</style>
