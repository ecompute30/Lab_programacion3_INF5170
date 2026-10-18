<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'

const { titulo, descripcion } = defineProps<{
  titulo: string
  descripcion: string
}>()
</script>

<template>
  <main class="pagina">
    <RouterLink :to="{ name: 'portafolio' }" class="volver">
      <ChevronLeft :size="18" aria-hidden="true" /> Volver a las prácticas
    </RouterLink>
    <header class="cabecera">
      <h1 class="titulo">{{ titulo }}</h1>
      <p class="descripcion">{{ descripcion }}</p>
    </header>
    <slot />
  </main>
</template>

<style scoped>
.pagina {
  max-width: 760px;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 4vw, 2rem) 4rem;
  display: grid;
  gap: 1.5rem;
}

.volver {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem 0.3rem 0.35rem;
  margin-left: -0.35rem;
  border-radius: 8px;
  color: var(--tinta-suave);
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 140ms ease, background-color 140ms ease;
}

.volver:hover {
  color: var(--azul-uasd);
  background-color: var(--azul-niebla);
}

.cabecera {
  display: grid;
  gap: 0.4rem;
}

.titulo {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  letter-spacing: -0.025em;
}

.descripcion {
  color: var(--tinta-suave);
  max-width: 60ch;
}
</style>

<style>
/* Tarjeta de formulario usada por las vistas que envuelve este componente. */
.tarjeta-formulario {
  display: grid;
  gap: 1.1rem;
  padding: 1.75rem;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: var(--radio-tarjeta);
  box-shadow: var(--sombra-reposo);
}

.tarjeta-formulario-titulo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.2rem;
}

.tarjeta-formulario-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding-top: 0.3rem;
}
</style>
