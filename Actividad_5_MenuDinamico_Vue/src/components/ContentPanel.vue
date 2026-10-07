<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '../types/menu'

const props = defineProps<{
  item: MenuItem | null
}>()

const descripcion = computed(() => {
  if (!props.item) return ''
  return `Esta es la sección "${props.item.nombre}". Su enlace asociado es "${props.item.enlace}". ` +
    'En una aplicación real, aquí se cargaría el contenido correspondiente a esta opción del menú ' +
    'mediante enrutamiento del lado del cliente, sin recargar toda la página.'
})
</script>

<template>
  <section class="panel-contenido">
    <template v-if="item">
      <h2>
        <span v-if="item.icono" aria-hidden="true">{{ item.icono }}</span>
        {{ item.nombre }}
      </h2>
      <p class="ruta-actual">Ruta: <code>{{ item.enlace }}</code></p>
      <p>{{ descripcion }}</p>
    </template>
    <template v-else>
      <h2>Bienvenido al Menú Dinámico Uastiano</h2>
      <p>
        Selecciona una opción del menú para ver su contenido aquí mismo, sin recargar la página.
        Puedes además agregar, editar o eliminar opciones desde el panel de administración más abajo,
        o importar un archivo JSON con una estructura de menú completa.
      </p>
    </template>
  </section>
</template>

<style scoped>
.panel-contenido {
  background-color: var(--blanco);
  border: 1px solid var(--gris-borde);
  border-radius: 10px;
  padding: 1.6rem 1.8rem;
  margin: 1.5rem 0;
}

.panel-contenido h2 {
  color: var(--azul-primario);
  margin-top: 0;
}

.ruta-actual code {
  background-color: var(--gris-claro);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}
</style>
