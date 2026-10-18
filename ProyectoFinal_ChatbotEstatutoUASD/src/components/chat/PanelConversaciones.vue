<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef } from 'vue'
import { Check, MessageSquarePlus, Pencil, Trash2, X } from 'lucide-vue-next'
import type { Conversacion } from '../../services/conversacionesStorage'

const { lista, idActual, abierto } = defineProps<{
  lista: Conversacion[]
  idActual: string | null
  abierto: boolean
}>()

const emit = defineEmits<{
  seleccionar: [id: string]
  nueva: []
  eliminar: [id: string]
  renombrar: [datos: { id: string; titulo: string }]
  cerrar: []
}>()

const editando = shallowRef<string | null>(null)
const tituloEditado = shallowRef('')
const campoEdicion = useTemplateRef<HTMLInputElement>('campoEdicion')

const formatoFecha = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short' })
const grupos = computed(() => {
  const hoy = new Date().toDateString()
  const ayer = new Date(Date.now() - 86_400_000).toDateString()
  const porGrupo = new Map<string, Conversacion[]>()
  for (const c of lista) {
    const dia = new Date(c.actualizadaEn).toDateString()
    const etiqueta = dia === hoy ? 'Hoy' : dia === ayer ? 'Ayer' : 'Anteriores'
    porGrupo.set(etiqueta, [...(porGrupo.get(etiqueta) ?? []), c])
  }
  return [...porGrupo.entries()]
})

async function empezarEdicion(c: Conversacion) {
  editando.value = c.id
  tituloEditado.value = c.titulo
  await nextTick()
  campoEdicion.value?.select()
}

function confirmarEdicion() {
  if (editando.value) emit('renombrar', { id: editando.value, titulo: tituloEditado.value })
  editando.value = null
}

function eliminar(c: Conversacion) {
  if (confirm(`¿Eliminar la conversación «${c.titulo}»?`)) emit('eliminar', c.id)
}
</script>

<template>
  <Transition name="fondo">
    <div v-if="abierto" class="fondo-movil" @click="emit('cerrar')" />
  </Transition>

  <aside class="panel" :class="{ abierto }" aria-label="Conversaciones guardadas">
    <div class="cabecera">
      <button type="button" class="boton boton-primario nueva" @click="emit('nueva')">
        <MessageSquarePlus :size="18" aria-hidden="true" /> Nueva conversación
      </button>
      <button type="button" class="cerrar" aria-label="Cerrar el panel" @click="emit('cerrar')">
        <X :size="20" aria-hidden="true" />
      </button>
    </div>

    <p v-if="lista.length === 0" class="vacio">Sus conversaciones aparecerán aquí y se guardan en este navegador.</p>

    <nav v-else class="lista">
      <section v-for="[etiqueta, conversaciones] in grupos" :key="etiqueta" class="grupo">
        <h2 class="grupo-titulo">{{ etiqueta }}</h2>
        <ul class="items">
          <li v-for="c in conversaciones" :key="c.id" class="item" :class="{ activo: c.id === idActual }">
            <form v-if="editando === c.id" class="edicion" @submit.prevent="confirmarEdicion">
              <input ref="campoEdicion" v-model="tituloEditado" class="campo-entrada edicion-campo" maxlength="80" @keydown.esc="editando = null">
              <button type="submit" class="accion" aria-label="Guardar el título"><Check :size="16" aria-hidden="true" /></button>
            </form>
            <template v-else>
              <button type="button" class="abrir" @click="emit('seleccionar', c.id)">
                <span class="titulo">{{ c.titulo }}</span>
                <span class="meta">{{ c.mensajes.length }} mensajes · {{ formatoFecha.format(new Date(c.actualizadaEn)) }}</span>
              </button>
              <span class="acciones">
                <button type="button" class="accion" aria-label="Renombrar" title="Renombrar" @click="empezarEdicion(c)"><Pencil :size="15" aria-hidden="true" /></button>
                <button type="button" class="accion accion-peligro" aria-label="Eliminar" title="Eliminar" @click="eliminar(c)"><Trash2 :size="15" aria-hidden="true" /></button>
              </span>
            </template>
          </li>
        </ul>
      </section>
    </nav>
  </aside>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--borde);
  background-color: var(--blanco);
}

.cabecera {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 0.9rem 0.6rem;
}

.nueva {
  flex: 1;
  justify-content: flex-start;
}

.cerrar {
  display: none;
  border: none;
  background: none;
  color: var(--tinta-suave);
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 8px;
}

.vacio {
  padding: 1rem 1.1rem;
  font-size: 0.875rem;
  color: var(--tinta-suave);
}

.lista {
  overflow-y: auto;
  padding: 0 0.6rem 1rem;
  scrollbar-width: thin;
}

.grupo-titulo {
  font-family: var(--fuente-texto);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--tinta-suave);
  padding: 0.8rem 0.5rem 0.3rem;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.15rem;
}

.item {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 10px;
  transition: background-color 140ms ease;
}

.item:hover,
.item.activo {
  background-color: var(--azul-niebla);
}

.item.activo .titulo {
  color: var(--azul-uasd);
}

.abrir {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.1rem;
  padding: 0.5rem 0.6rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
}

.titulo {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--tinta);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  font-size: 0.74rem;
  color: var(--tinta-suave);
}

.acciones {
  display: flex;
  gap: 0.1rem;
  padding-right: 0.3rem;
  opacity: 0;
  transition: opacity 140ms ease;
}

.item:hover .acciones,
.item.activo .acciones,
.item:focus-within .acciones {
  opacity: 1;
}

.accion {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: none;
  border-radius: 7px;
  background: none;
  color: var(--tinta-suave);
  cursor: pointer;
}

.accion:hover {
  background-color: var(--blanco);
  color: var(--azul-uasd);
}

.accion-peligro:hover {
  color: var(--rojo);
}

.edicion {
  flex: 1;
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem 0.3rem;
}

.edicion-campo {
  padding: 0.35rem 0.5rem;
  font-size: 0.9rem;
}

.fondo-movil {
  display: none;
}

@media (max-width: 900px) {
  .panel {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    width: min(var(--ancho-panel), 85vw);
    transform: translateX(-100%);
    transition: transform 260ms var(--ease-out);
    box-shadow: none;
  }

  .panel.abierto {
    transform: translateX(0);
    box-shadow: var(--sombra-elevada);
  }

  .cerrar {
    display: grid;
  }

  .fondo-movil {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 35;
    background-color: rgb(13 42 92 / 0.4);
  }

  .acciones {
    opacity: 1;
  }

  .fondo-enter-active,
  .fondo-leave-active {
    transition: opacity 200ms ease;
  }

  .fondo-enter-from,
  .fondo-leave-to {
    opacity: 0;
  }
}
</style>
