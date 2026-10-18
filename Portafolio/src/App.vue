<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'

const ruta = useRoute()
const conEncabezado = computed(() => !ruta.meta.publica)
</script>

<template>
  <AppHeader v-if="conEncabezado" />
  <RouterView v-slot="{ Component, route }">
    <Transition name="vista" mode="out-in">
      <component :is="Component" :key="route.name" />
    </Transition>
  </RouterView>
</template>

<style>
.vista-enter-active {
  transition: opacity 260ms var(--ease-out), transform 260ms var(--ease-out);
}

.vista-leave-active {
  transition: opacity 140ms ease;
}

.vista-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.vista-leave-to {
  opacity: 0;
}
</style>
