<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import MenuBar from './components/MenuBar.vue'
import ContentPanel from './components/ContentPanel.vue'
import MenuEditorForm from './components/MenuEditorForm.vue'
import JsonImporter from './components/JsonImporter.vue'
import { useMenu } from './composables/useMenu'
import type { MenuItem } from './types/menu'

const { items, eliminarOpcion } = useMenu()

const menuAbierto = ref(false)
const itemSeleccionado = ref<MenuItem | null>(null)
const itemEnEdicion = ref<MenuItem | null>(null)

function seleccionar(item: MenuItem) {
  itemSeleccionado.value = item
  menuAbierto.value = false
}

function editar(item: MenuItem) {
  itemEnEdicion.value = item
  document.getElementById('panel-administracion')?.scrollIntoView({ behavior: 'smooth' })
}

function eliminar(id: number) {
  eliminarOpcion(id)
  if (itemSeleccionado.value?.id === id) itemSeleccionado.value = null
  if (itemEnEdicion.value?.id === id) itemEnEdicion.value = null
}
</script>

<template>
  <AppHeader :menu-abierto="menuAbierto" @toggle-menu="menuAbierto = !menuAbierto" />
  <MenuBar
    :items="items"
    :menu-abierto="menuAbierto"
    @seleccionar="seleccionar"
    @editar="editar"
    @eliminar="eliminar"
  />

  <main class="contenido-principal">
    <ContentPanel :item="itemSeleccionado" />

    <section id="panel-administracion" class="panel-administracion">
      <h2>Administración del menú</h2>
      <p class="descripcion-panel">
        Agrega, edita o elimina opciones del menú, o reemplaza toda la estructura importando un archivo JSON.
        Los cambios se reflejan de inmediato arriba, sin recargar la página.
      </p>
      <div class="rejilla-administracion">
        <MenuEditorForm :item-en-edicion="itemEnEdicion" @cancelar-edicion="itemEnEdicion = null" />
        <JsonImporter />
      </div>
    </section>
  </main>

  <footer class="pie-pagina">
    <p>&copy; 2026 Banco Uastiano. Proyecto académico — Práctica 4: Menú Dinámico con Vue 3 + TypeScript.</p>
  </footer>
</template>

<style scoped>
.contenido-principal {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 5% 3rem;
}

.panel-administracion {
  margin-top: 1rem;
}

.panel-administracion h2 {
  color: var(--azul-primario);
}

.descripcion-panel {
  font-size: 0.92rem;
  color: #4a5568;
}

.rejilla-administracion {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.3rem;
  align-items: start;
}

.pie-pagina {
  background-color: var(--azul-oscuro);
  color: #b7c3d6;
  text-align: center;
  padding: 1rem 5%;
  font-size: 0.8rem;
}
</style>
