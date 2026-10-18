<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const ruta = useRoute()
const conEncabezado = computed(() => !ruta.meta.publica)
</script>

<template>
  <div class="aplicacion">
    <AppHeader v-if="conEncabezado" />
    <RouterView v-slot="{ Component, route }">
      <Transition name="vista" mode="out-in">
        <component :is="Component" :key="route.meta.titulo" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
.aplicacion {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.vista-enter-active {
  transition: opacity 220ms var(--ease-out);
}

.vista-leave-active {
  transition: opacity 120ms ease;
}

.vista-enter-from,
.vista-leave-to {
  opacity: 0;
}
</style>
