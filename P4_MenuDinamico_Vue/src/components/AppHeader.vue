<script setup lang="ts">
defineProps<{
  menuAbierto: boolean
}>()

const emit = defineEmits<{
  'toggle-menu': []
}>()
</script>

<template>
  <header class="encabezado">
    <div class="encabezado-marca">
      <img
        src="https://uasd.edu.do/wp-content/themes/pagina/img/logo_uasd_pie.svg"
        alt="Universidad Autónoma de Santo Domingo"
      >
      <span>Menú Dinámico Uastiano</span>
    </div>

    <button
      type="button"
      class="boton-hamburguesa"
      :aria-expanded="menuAbierto"
      aria-label="Abrir o cerrar el menú"
      @click="emit('toggle-menu')"
    >
      &#9776;
    </button>
  </header>
</template>

<style scoped>
.encabezado {
  background-color: var(--azul-primario);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 5%;
}

.encabezado-marca {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.encabezado-marca img {
  height: 38px;
  width: auto;
}

.encabezado-marca span {
  color: var(--blanco);
  font-weight: bold;
  font-size: 1.05rem;
  border-left: 2px solid var(--dorado);
  padding-left: 0.6rem;
}

.boton-hamburguesa {
  display: none;
  background: none;
  border: none;
  color: var(--blanco);
  font-size: 1.6rem;
  cursor: pointer;
}

@media (max-width: 820px) {
  .boton-hamburguesa {
    display: block;
  }
}
</style>
