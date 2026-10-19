<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { BookOpenText, ChevronDown, FileText, KeyRound, LogOut, MessageSquareText, Presentation, Settings2 } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { APP, LOGO_UASD_BLANCO } from '../data/marca'

const { usuario, esAdmin, cerrarSesion } = useAuth()
const router = useRouter()
const ruta = useRoute()

const menuAbierto = shallowRef(false)
const contenedorMenu = useTemplateRef<HTMLElement>('contenedorMenu')
const base = import.meta.env.BASE_URL

const iniciales = computed(() =>
  (usuario.value?.nombre ?? '?')
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join(''),
)
const nombreRol = computed(() => (esAdmin.value ? 'administrador' : 'revisora'))

watch(() => ruta.fullPath, () => (menuAbierto.value = false))

function alHacerClicFuera(evento: PointerEvent) {
  if (!contenedorMenu.value?.contains(evento.target as Node)) menuAbierto.value = false
}

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape') menuAbierto.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', alHacerClicFuera)
  document.addEventListener('keydown', alPresionarTecla)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', alHacerClicFuera)
  document.removeEventListener('keydown', alPresionarTecla)
})

async function salir() {
  cerrarSesion()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <header class="encabezado">
    <RouterLink :to="{ name: 'chat' }" class="marca">
      <img class="logo" :src="LOGO_UASD_BLANCO" alt="UASD" width="96" height="36">
      <span class="marca-texto">
        <span class="marca-nombre">{{ APP.nombre }}</span>
        <span class="marca-sub">Estatuto Orgánico</span>
      </span>
    </RouterLink>

    <nav class="enlaces" aria-label="Recursos del proyecto">
      <a class="enlace" :href="`${base}${APP.presentacion}`" target="_blank" rel="noopener noreferrer">
        <Presentation :size="17" aria-hidden="true" /> <span>Presentación</span>
      </a>
      <a class="enlace" :href="`${base}${APP.documentoTecnico}`" target="_blank" rel="noopener noreferrer">
        <FileText :size="17" aria-hidden="true" /> <span>Documento técnico</span>
      </a>
      <a class="enlace" :href="`${base}docs/ESTATUTO-ORGANICO-UASD.pdf`" target="_blank" rel="noopener noreferrer">
        <BookOpenText :size="17" aria-hidden="true" /> <span>Estatuto (PDF)</span>
      </a>
    </nav>

    <div v-if="usuario" ref="contenedorMenu" class="usuario">
      <button
        type="button"
        class="usuario-boton"
        :aria-expanded="menuAbierto"
        aria-haspopup="menu"
        aria-controls="menu-usuario"
        @click="menuAbierto = !menuAbierto"
      >
        <span class="avatar" aria-hidden="true">{{ iniciales }}</span>
        <span class="usuario-nombre">{{ usuario.nombre }}</span>
        <ChevronDown class="flecha" :class="{ girada: menuAbierto }" :size="16" aria-hidden="true" />
      </button>

      <Transition name="menu">
        <div v-if="menuAbierto" id="menu-usuario" class="menu" role="menu">
          <div class="menu-cabecera">
            <p class="menu-nombre">{{ usuario.nombre }}</p>
            <p class="menu-detalle">@{{ usuario.usuario }}, {{ nombreRol }}</p>
          </div>
          <RouterLink :to="{ name: 'chat' }" class="menu-opcion" role="menuitem">
            <MessageSquareText :size="17" aria-hidden="true" /> Conversación
          </RouterLink>
          <RouterLink v-if="esAdmin" :to="{ name: 'configuracion' }" class="menu-opcion" role="menuitem">
            <Settings2 :size="17" aria-hidden="true" /> Configuración de IA
          </RouterLink>
          <RouterLink :to="{ name: 'cuenta' }" class="menu-opcion" role="menuitem">
            <KeyRound :size="17" aria-hidden="true" /> Cambiar contraseña
          </RouterLink>
          <div class="menu-separador" role="separator" />
          <a class="menu-opcion menu-movil" :href="`${base}${APP.presentacion}`" target="_blank" rel="noopener noreferrer" role="menuitem">
            <Presentation :size="17" aria-hidden="true" /> Presentación
          </a>
          <a class="menu-opcion menu-movil" :href="`${base}${APP.documentoTecnico}`" target="_blank" rel="noopener noreferrer" role="menuitem">
            <FileText :size="17" aria-hidden="true" /> Documento técnico
          </a>
          <a class="menu-opcion menu-movil" :href="`${base}docs/ESTATUTO-ORGANICO-UASD.pdf`" target="_blank" rel="noopener noreferrer" role="menuitem">
            <BookOpenText :size="17" aria-hidden="true" /> Estatuto (PDF)
          </a>
          <button type="button" class="menu-opcion menu-salir" role="menuitem" @click="salir">
            <LogOut :size="17" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </Transition>
    </div>
  </header>
</template>

<style scoped>
.encabezado {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: var(--alto-encabezado);
  padding: 0 clamp(0.9rem, 3vw, 1.5rem);
  background-color: var(--azul-uasd);
  box-shadow: 0 1px 0 rgb(255 255 255 / 0.08), 0 6px 18px rgb(13 42 92 / 0.18);
}

.marca {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  border-radius: 8px;
  margin-right: auto;
}

.logo {
  height: 34px;
  width: auto;
}

.marca-texto {
  display: grid;
  line-height: 1.1;
  padding-left: 0.75rem;
  border-left: 2px solid var(--dorado);
}

.marca-nombre {
  color: var(--blanco);
  font-family: var(--fuente-titulos);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}

.marca-sub {
  color: rgb(255 255 255 / 0.72);
  font-size: 0.75rem;
}

.enlaces {
  display: flex;
  gap: 0.25rem;
}

.enlace {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border-radius: 9px;
  color: rgb(255 255 255 / 0.88);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 140ms ease, color 140ms ease;
}

.enlace:hover {
  background-color: rgb(255 255 255 / 0.12);
  color: var(--blanco);
}

.usuario {
  position: relative;
}

.usuario-boton {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.3rem 0.6rem 0.3rem 0.3rem;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 999px;
  background-color: rgb(255 255 255 / 0.08);
  color: var(--blanco);
  cursor: pointer;
  transition: background-color 160ms ease;
}

.usuario-boton:hover {
  background-color: rgb(255 255 255 / 0.16);
}

.avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--blanco);
  color: var(--azul-uasd);
  font-size: 0.75rem;
  font-weight: 700;
}

.usuario-nombre {
  font-size: 0.9rem;
  font-weight: 600;
}

.flecha {
  transition: transform 200ms var(--ease-out);
}

.flecha.girada {
  transform: rotate(180deg);
}

.menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  width: 250px;
  padding: 0.4rem;
  display: grid;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 14px;
  box-shadow: var(--sombra-elevada);
  transform-origin: top right;
}

.menu-cabecera {
  padding: 0.6rem 0.7rem 0.7rem;
  margin-bottom: 0.3rem;
  border-bottom: 1px solid var(--borde);
}

.menu-nombre {
  font-weight: 700;
  color: var(--azul-tinta);
}

.menu-detalle {
  font-size: 0.8rem;
  color: var(--tinta-suave);
}

.menu-separador {
  display: none;
  height: 1px;
  margin: 0.3rem 0;
  background-color: var(--borde);
}

.menu-movil {
  display: none;
}

.menu-opcion {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: none;
  border-radius: 9px;
  background: none;
  color: var(--tinta);
  font-size: 0.92rem;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.menu-opcion:hover,
.menu-opcion.router-link-exact-active {
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
}

.menu-salir:hover {
  background-color: var(--rojo-suave);
  color: var(--rojo);
}

.menu-enter-active {
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}

.menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-4px);
}

@media (max-width: 900px) {
  .enlaces {
    display: none;
  }

  .menu-separador,
  .menu-movil {
    display: flex;
  }
}

@media (max-width: 600px) {
  .usuario-nombre,
  .marca-sub {
    display: none;
  }
}
</style>
