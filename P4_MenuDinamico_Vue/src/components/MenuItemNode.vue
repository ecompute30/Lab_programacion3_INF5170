<script setup lang="ts">
import type { MenuItem } from '../types/menu'

defineProps<{
  item: MenuItem
  profundidad?: number
}>()

const emit = defineEmits<{
  seleccionar: [item: MenuItem]
  editar: [item: MenuItem]
  eliminar: [id: number]
}>()
</script>

<template>
  <li class="nodo-menu" :class="`profundidad-${profundidad ?? 0}`">
    <div class="fila-opcion">
      <a
        :href="item.enlace"
        class="enlace-opcion"
        @click.prevent="emit('seleccionar', item)"
      >
        <span v-if="item.icono" class="icono-opcion" aria-hidden="true">{{ item.icono }}</span>
        {{ item.nombre }}
        <span v-if="item.submenu?.length" class="flecha-submenu" aria-hidden="true">▾</span>
      </a>
      <span class="acciones-opcion">
        <button type="button" title="Editar" @click="emit('editar', item)">✎</button>
        <button type="button" title="Eliminar" @click="emit('eliminar', item.id)">✕</button>
      </span>
    </div>

    <ul v-if="item.submenu?.length" class="submenu">
      <MenuItemNode
        v-for="hijo in item.submenu"
        :key="hijo.id"
        :item="hijo"
        :profundidad="(profundidad ?? 0) + 1"
        @seleccionar="(i) => emit('seleccionar', i)"
        @editar="(i) => emit('editar', i)"
        @eliminar="(id) => emit('eliminar', id)"
      />
    </ul>
  </li>
</template>

<style scoped>
.nodo-menu {
  position: relative;
  list-style: none;
}

.fila-opcion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.enlace-opcion {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: inherit;
  text-decoration: none;
  padding: 0.85rem 1rem;
  white-space: nowrap;
}

.profundidad-0 > .fila-opcion .enlace-opcion {
  color: var(--blanco);
}

.profundidad-0 > .fila-opcion:hover .enlace-opcion,
.nodo-menu:focus-within > .fila-opcion .enlace-opcion {
  background-color: var(--azul-brillante);
}

.icono-opcion {
  font-size: 1rem;
}

.flecha-submenu {
  font-size: 0.7rem;
  opacity: 0.8;
}

.acciones-opcion {
  display: none;
  gap: 0.2rem;
  padding-right: 0.4rem;
}

.fila-opcion:hover .acciones-opcion,
.nodo-menu:focus-within > .fila-opcion .acciones-opcion {
  display: flex;
}

.acciones-opcion button {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
}

.acciones-opcion button:hover {
  background: rgba(255, 255, 255, 0.35);
}

.submenu {
  display: none;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0.3rem 0;
  background-color: var(--blanco);
  color: var(--azul-oscuro);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
  min-width: 240px;
  z-index: 30;
}

.profundidad-0 > .submenu {
  position: absolute;
  top: 100%;
  left: 0;
}

.profundidad-1 > .submenu,
.profundidad-2 > .submenu {
  position: absolute;
  top: 0;
  left: 100%;
}

.nodo-menu:hover > .submenu,
.nodo-menu:focus-within > .submenu {
  display: flex;
}

.submenu .enlace-opcion {
  color: var(--azul-oscuro);
}

.submenu .fila-opcion:hover .enlace-opcion {
  background-color: var(--gris-claro);
  color: var(--azul-brillante);
}

.submenu .acciones-opcion button {
  background: var(--gris-claro);
  color: var(--azul-oscuro);
}

@media (max-width: 820px) {
  .profundidad-0 > .submenu,
  .profundidad-1 > .submenu,
  .profundidad-2 > .submenu {
    position: static;
    box-shadow: none;
    display: none;
    padding-left: 1rem;
  }
}
</style>
