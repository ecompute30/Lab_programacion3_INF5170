<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { CircleAlert, CircleCheck, KeyRound, LoaderCircle } from 'lucide-vue-next'
import CampoContrasena from '../components/CampoContrasena.vue'
import PaginaFormulario from '../components/PaginaFormulario.vue'
import { useAuth } from '../composables/useAuth'
import { LONGITUD_MINIMA_CONTRASENA } from '../services/authStorage'
import { formatearFecha } from '../utils/fechas'

const { usuario, cambiarContrasena } = useAuth()

const actual = shallowRef('')
const nueva = shallowRef('')
const confirmacion = shallowRef('')
const guardando = shallowRef(false)
const error = shallowRef('')
const exito = shallowRef(false)

const descripcion = computed(() =>
  usuario.value
    ? `Cuenta @${usuario.value.usuario}. Último cambio: ${formatearFecha(usuario.value.contrasenaActualizadaEn)}.`
    : '',
)

async function guardar() {
  guardando.value = true
  error.value = ''
  exito.value = false
  const resultado = await cambiarContrasena(actual.value, nueva.value, confirmacion.value)
  guardando.value = false

  if (!resultado.ok) {
    error.value = resultado.error
    return
  }
  exito.value = true
  actual.value = ''
  nueva.value = ''
  confirmacion.value = ''
}
</script>

<template>
  <PaginaFormulario titulo="Cambiar contraseña" :descripcion="descripcion">
    <form class="tarjeta-formulario" novalidate @submit.prevent="guardar">
      <h2 class="tarjeta-formulario-titulo"><KeyRound :size="20" aria-hidden="true" /> Nueva contraseña</h2>

      <CampoContrasena v-model="actual" etiqueta="Contraseña actual" />
      <CampoContrasena
        v-model="nueva"
        etiqueta="Contraseña nueva"
        autocomplete="new-password"
        :ayuda="`Al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres y distinta de la actual.`"
      />
      <CampoContrasena v-model="confirmacion" etiqueta="Confirme la contraseña nueva" autocomplete="new-password" />

      <p v-if="error" class="mensaje mensaje-error" role="alert">
        <CircleAlert :size="18" aria-hidden="true" /> {{ error }}
      </p>
      <p v-if="exito" class="mensaje mensaje-exito" role="status">
        <CircleCheck :size="18" aria-hidden="true" /> Contraseña actualizada. Úsela la próxima vez que inicie sesión.
      </p>

      <div class="tarjeta-formulario-acciones">
        <button type="submit" class="boton boton-primario" :disabled="guardando || !actual || !nueva || !confirmacion">
          <LoaderCircle v-if="guardando" class="girando" :size="18" aria-hidden="true" />
          {{ guardando ? 'Guardando…' : 'Guardar contraseña' }}
        </button>
      </div>
    </form>
  </PaginaFormulario>
</template>

