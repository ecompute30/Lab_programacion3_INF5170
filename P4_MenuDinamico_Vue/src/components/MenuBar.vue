<script setup lang="ts">
import type { MenuItem } from '../types/menu'
import MenuItemNode from './MenuItemNode.vue'

defineProps<{
  items: MenuItem[]
  menuAbierto: boolean
}>()

const emit = defineEmits<{
  seleccionar: [item: MenuItem]
  editar: [item: MenuItem]
  eliminar: [id: number]
}>()
</script>

<template>
  <nav class="barra-menu" :class="{ abierta: menuAbierto }">
    <ul class="lista-menu">
      <MenuItemNode
        v-for="item in items"
        :key="item.id"
        :item="item"
        @seleccionar="(i) => emit('seleccionar', i)"
        @editar="(i) => emit('editar', i)"
        @eliminar="(id) => emit('eliminar', id)"
      />
    </ul>
    <p v-if="items.length === 0" class="menu-vacio">
      El menú no tiene opciones. Agrega una desde el panel de abajo.
    </p>
  </nav>
</template>

<style scoped>
.barra-menu {
  background-color: #0f3a80;
}

.lista-menu {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0 5%;
}

.menu-vacio {
  color: var(--blanco);
  padding: 0.6rem 5%;
  margin: 0;
  font-size: 0.85rem;
}

@media (max-width: 820px) {
  .lista-menu {
    flex-direction: column;
    padding: 0;
    display: none;
  }

  .barra-menu.abierta .lista-menu {
    display: flex;
  }
}
</style>
