<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, LoaderCircle, LockKeyhole } from 'lucide-vue-next'
import CampoContrasena from '../components/CampoContrasena.vue'
import { useAuth } from '../composables/useAuth'
import { CURSO, LOGO_UASD_BLANCO } from '../data/marca'

const { iniciarSesion } = useAuth()
const router = useRouter()
const ruta = useRoute()

const usuario = shallowRef('')
const contrasena = shallowRef('')
const enviando = shallowRef(false)
const error = shallowRef('')
const sacudiendo = shallowRef(false)
const segundosBloqueo = shallowRef(0)

let cuentaRegresiva: ReturnType<typeof setInterval> | undefined

const bloqueado = computed(() => segundosBloqueo.value > 0)
const mensajeError = computed(() =>
  bloqueado.value
    ? `Demasiados intentos fallidos. Podrás intentarlo de nuevo en ${segundosBloqueo.value} s.`
    : error.value,
)

function iniciarCuentaRegresiva(segundos: number) {
  clearInterval(cuentaRegresiva)
  segundosBloqueo.value = segundos
  cuentaRegresiva = setInterval(() => {
    segundosBloqueo.value -= 1
    if (segundosBloqueo.value <= 0) clearInterval(cuentaRegresiva)
  }, 1000)
}

onBeforeUnmount(() => clearInterval(cuentaRegresiva))

async function enviar() {
  if (enviando.value || bloqueado.value) return
  enviando.value = true
  error.value = ''

  const resultado = await iniciarSesion(usuario.value, contrasena.value)
  enviando.value = false

  if (resultado.ok) {
    const volver = typeof ruta.query.volver === 'string' ? ruta.query.volver : '/'
    await router.replace(volver)
    return
  }

  contrasena.value = ''
  sacudiendo.value = false
  requestAnimationFrame(() => (sacudiendo.value = true))
  await nextTick()
  document.getElementById('login-contrasena')?.focus()
  if (resultado.motivo === 'bloqueado') {
    iniciarCuentaRegresiva(resultado.segundosRestantes ?? 60)
  } else {
    const restantes = resultado.intentosRestantes
    error.value =
      'Usuario o contraseña incorrectos.' +
      (restantes !== undefined && restantes <= 2 ? ` Te quedan ${restantes} intento${restantes === 1 ? '' : 's'}.` : '')
  }
}
</script>

<template>
  <main class="login">
    <section class="marca" aria-label="Universidad Autónoma de Santo Domingo">
      <span class="anillo anillo-grande" aria-hidden="true" />
      <span class="anillo anillo-pequeno" aria-hidden="true" />

      <img class="logo" :src="LOGO_UASD_BLANCO" alt="UASD — Universidad Autónoma de Santo Domingo" width="168" height="64">

      <div class="marca-texto">
        <p class="marca-titulo">Portafolio de prácticas</p>
        <p class="marca-curso">{{ CURSO.nombre }} ({{ CURSO.codigo }})</p>
        <p class="marca-autor">{{ CURSO.estudiante }}</p>
      </div>
    </section>

    <section class="formulario-zona">
      <form class="formulario" :class="{ sacudir: sacudiendo }" novalidate @submit.prevent="enviar" @animationend="sacudiendo = false">
        <span class="icono-candado" aria-hidden="true"><LockKeyhole :size="22" /></span>
        <h1 class="titulo">Inicia sesión</h1>
        <p class="subtitulo">Usa la cuenta que te compartieron para revisar las prácticas.</p>

        <div class="campo">
          <label class="campo-etiqueta" for="login-usuario">Usuario</label>
          <input
            id="login-usuario"
            v-model="usuario"
            class="campo-entrada"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
            autofocus
          >
        </div>

        <CampoContrasena id="login-contrasena" v-model="contrasena" etiqueta="Contraseña" />

        <p v-if="mensajeError" class="mensaje mensaje-error" role="alert">
          <CircleAlert :size="18" aria-hidden="true" />
          {{ mensajeError }}
        </p>

        <button
          type="submit"
          class="boton boton-primario boton-entrar"
          :disabled="enviando || bloqueado || !usuario || !contrasena"
        >
          <LoaderCircle v-if="enviando" class="girando" :size="18" aria-hidden="true" />
          {{ enviando ? 'Verificando…' : 'Entrar' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(320px, 2fr) 3fr;
  background-color: var(--papel);
}

/* Panel institucional */
.marca {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem 3.25rem;
  color: var(--blanco);
  background:
    radial-gradient(120% 80% at 0% 0%, rgb(255 255 255 / 0.1), transparent 60%),
    linear-gradient(160deg, var(--azul-uasd) 0%, var(--azul-tinta) 100%);
}

.anillo {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgb(255 255 255 / 0.16);
  pointer-events: none;
}

.anillo-grande {
  width: 420px;
  height: 420px;
  top: -160px;
  right: -170px;
}

.anillo-pequeno {
  width: 96px;
  height: 96px;
  bottom: 30%;
  right: 16%;
  background-color: rgb(255 255 255 / 0.04);
}

.logo {
  position: relative;
  align-self: flex-start;
  height: 72px;
  width: auto;
  animation: aparecer 600ms var(--ease-out) both;
}

.marca-texto {
  position: relative;
  display: grid;
  gap: 0.35rem;
  animation: aparecer 600ms 120ms var(--ease-out) both;
}

.marca-titulo {
  font-family: var(--fuente-titulos);
  font-size: clamp(2rem, 3.4vw, 2.75rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.02em;
  max-width: 12ch;
}

.marca-curso {
  font-size: 1rem;
  color: rgb(255 255 255 / 0.85);
  padding-left: 0.75rem;
  border-left: 3px solid var(--dorado);
  margin-top: 0.6rem;
}

.marca-autor {
  font-size: 0.875rem;
  color: rgb(255 255 255 / 0.65);
  padding-left: calc(0.75rem + 3px);
}

/* Formulario */
.formulario-zona {
  display: grid;
  place-items: center;
  padding: 2.5rem 1.5rem;
}

.formulario {
  width: min(100%, 400px);
  display: grid;
  gap: 1.1rem;
  padding: 2.4rem 2.2rem;
  background-color: var(--blanco);
  border: 1px solid var(--borde);
  border-radius: 22px;
  box-shadow: var(--sombra-elevada);
  animation: subir 520ms 80ms var(--ease-out) both;
}

.formulario.sacudir {
  animation: sacudir 380ms var(--ease-out);
}

.icono-candado {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: var(--azul-uasd);
  background-color: var(--azul-niebla);
}

.titulo {
  font-size: 1.75rem;
  letter-spacing: -0.01em;
}

.subtitulo {
  margin-top: -0.6rem;
  color: var(--tinta-suave);
  font-size: 0.95rem;
}

.boton-entrar {
  width: 100%;
  padding-block: 0.8rem;
  margin-top: 0.3rem;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes subir {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.985);
  }
}

@keyframes sacudir {
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

@media (max-width: 820px) {
  .login {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .marca {
    padding: 1.75rem 1.5rem 2rem;
    gap: 2rem;
  }

  .logo {
    height: 48px;
  }

  .marca-titulo {
    font-size: 1.9rem;
    max-width: none;
  }

  .anillo-pequeno {
    display: none;
  }

  .formulario-zona {
    place-items: start center;
    padding-top: 0;
    margin-top: -1rem;
  }

  .formulario {
    padding: 1.9rem 1.4rem;
  }
}
</style>
