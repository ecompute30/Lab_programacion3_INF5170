<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BannerModo from '../components/BannerModo.vue'
import Compositor from '../components/chat/Compositor.vue'
import EstadoVacio from '../components/chat/EstadoVacio.vue'
import ListaMensajes from '../components/chat/ListaMensajes.vue'
import ModalPreguntas from '../components/chat/ModalPreguntas.vue'
import PanelArticulo from '../components/chat/PanelArticulo.vue'
import PanelConversaciones from '../components/chat/PanelConversaciones.vue'
import { useAuth } from '../composables/useAuth'
import { useChat } from '../composables/useChat'
import { useConfiguracion } from '../composables/useConfiguracion'
import { useConversaciones } from '../composables/useConversaciones'
import { cargarCorpus } from '../services/corpus'

const { usuario, esAdmin } = useAuth()
const ruta = useRoute()
const router = useRouter()

const nombreUsuario = computed(() => usuario.value?.usuario ?? 'anonimo')
const conversaciones = useConversaciones(nombreUsuario)
const chat = useChat(conversaciones)
const { configuracion, cargarEstados } = useConfiguracion()

const panelAbierto = shallowRef(false)
const articuloAbierto = shallowRef<number | null>(null)
const modalPreguntas = shallowRef(false)

// La URL /c/:id y la conversación activa se mantienen sincronizadas en ambos sentidos.
watch(
  () => ruta.params.id,
  (id) => conversaciones.seleccionar(typeof id === 'string' ? id : null),
  { immediate: true },
)
watch(conversaciones.idActual, (id) => {
  const enRuta = typeof ruta.params.id === 'string' ? ruta.params.id : null
  if (id !== enRuta) router.replace(id ? { name: 'conversacion', params: { id } } : { name: 'chat' })
})

onMounted(() => {
  cargarCorpus().catch(() => {})
  cargarEstados()
})

function preguntar(texto: string) {
  modalPreguntas.value = false
  panelAbierto.value = false
  chat.enviar(texto)
}

function nuevaConversacion() {
  if (chat.enviando.value) chat.cancelar()
  conversaciones.seleccionar(null)
  panelAbierto.value = false
}
</script>

<template>
  <main class="chat">
    <PanelConversaciones
      :lista="conversaciones.lista.value"
      :id-actual="conversaciones.idActual.value"
      :abierto="panelAbierto"
      @seleccionar="conversaciones.seleccionar($event); panelAbierto = false"
      @nueva="nuevaConversacion"
      @eliminar="conversaciones.eliminar($event)"
      @renombrar="conversaciones.renombrar($event.id, $event.titulo)"
      @cerrar="panelAbierto = false"
    />

    <section class="hilo" aria-label="Conversación con Primada">
      <BannerModo :traza="chat.ultimaTraza.value" :error-corpus="chat.errorCorpus.value" :es-admin="esAdmin" />

      <ListaMensajes
        v-if="conversaciones.mensajes.value.length"
        :mensajes="conversaciones.mensajes.value"
        :etapa="chat.etapa.value"
        :traza="configuracion.mostrarTraza ? chat.ultimaTraza.value : null"
        @ver-articulo="articuloAbierto = $event"
        @reintentar="chat.reintentar($event)"
      />
      <EstadoVacio
        v-else
        :nombre="usuario?.nombre ?? ''"
        @preguntar="preguntar"
        @ver-todas="modalPreguntas = true"
      />

      <Compositor
        :enviando="chat.enviando.value"
        :etapa="chat.etapa.value"
        @enviar="preguntar"
        @cancelar="chat.cancelar"
        @abrir-panel="panelAbierto = true"
        @ver-sugeridas="modalPreguntas = true"
      />
    </section>

    <PanelArticulo :numero="articuloAbierto" @cerrar="articuloAbierto = null" @navegar="articuloAbierto = $event" />
    <ModalPreguntas :abierto="modalPreguntas" @elegir="preguntar" @cerrar="modalPreguntas = false" />
  </main>
</template>

<style scoped>
.chat {
  flex: none;
  display: grid;
  grid-template-columns: var(--ancho-panel) 1fr;
  min-height: 0;
  height: calc(100dvh - var(--alto-encabezado));
}

.hilo {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background-color: var(--papel);
}

@media (max-width: 900px) {
  .chat {
    grid-template-columns: 1fr;
  }
}
</style>
