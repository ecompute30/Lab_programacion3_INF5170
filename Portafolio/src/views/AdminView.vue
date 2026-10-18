<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { CircleAlert, CircleCheck, GraduationCap, RotateCcw, Save, UsersRound } from 'lucide-vue-next'
import PaginaFormulario from '../components/PaginaFormulario.vue'
import { useAuth } from '../composables/useAuth'
import { listarUsuarios, restablecerContrasena, type UsuarioPublico } from '../services/authStorage'
import {
  cargarProyectoFinal,
  esUrlSegura,
  guardarProyectoFinal,
  restaurarProyectoFinal,
} from '../services/proyectoFinalStorage'
import { formatearFecha } from '../utils/fechas'
import type { ProyectoFinal } from '../types/proyecto'

const { usuario } = useAuth()

/* Proyecto final */
function aFormulario(datos: ProyectoFinal) {
  return { ...datos, tecnologias: datos.tecnologias.join(', ') }
}

const formulario = reactive(aFormulario(cargarProyectoFinal()))
const avisoProyecto = shallowRef<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

const errorUrlDemo = computed(() => (esUrlSegura(formulario.urlDemo) ? '' : 'Escribe una dirección que empiece con https://'))
const errorUrlCodigo = computed(() => (esUrlSegura(formulario.urlCodigo) ? '' : 'Escribe una dirección que empiece con https://'))
const formularioValido = computed(() => formulario.titulo.trim() !== '' && !errorUrlDemo.value && !errorUrlCodigo.value)

function guardarFinal() {
  if (!formularioValido.value) return
  const guardado = guardarProyectoFinal({
    titulo: formulario.titulo.trim(),
    resumen: formulario.resumen.trim(),
    tecnologias: formulario.tecnologias.split(',').map((t) => t.trim()).filter(Boolean),
    urlDemo: formulario.urlDemo,
    urlCodigo: formulario.urlCodigo,
    fechaEntrega: formulario.fechaEntrega,
  })
  Object.assign(formulario, aFormulario(guardado))
  avisoProyecto.value = {
    tipo: 'exito',
    texto: guardado.urlDemo
      ? 'Proyecto final guardado. Ya aparece como publicado en el portafolio.'
      : 'Proyecto final guardado. Aparecerá como publicado cuando tenga URL de la demo.',
  }
}

function restaurarFinal() {
  if (!confirm('¿Restaurar los datos del proyecto final a los valores del código? Se perderán los cambios guardados aquí.')) return
  Object.assign(formulario, aFormulario(restaurarProyectoFinal()))
  avisoProyecto.value = { tipo: 'exito', texto: 'Se restauraron los valores por defecto.' }
}

/* Cuentas */
const cuentas = shallowRef<UsuarioPublico[]>([])
const avisoCuentas = shallowRef<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

async function cargarCuentas() {
  cuentas.value = await listarUsuarios()
}

onMounted(cargarCuentas)

async function restablecer(cuenta: UsuarioPublico) {
  if (!confirm(`¿Restablecer la contraseña de @${cuenta.usuario} a su valor inicial?`)) return
  const resultado = await restablecerContrasena(cuenta.usuario)
  avisoCuentas.value = resultado.ok
    ? { tipo: 'exito', texto: `La contraseña de @${cuenta.usuario} volvió a su valor inicial.` }
    : { tipo: 'error', texto: resultado.error }
  await cargarCuentas()
}
</script>

<template>
  <PaginaFormulario
    titulo="Administración"
    descripcion="Completa los datos del proyecto final cuando esté listo y gestiona las cuentas de acceso. Todo se guarda en este navegador."
  >
    <form class="tarjeta-formulario" novalidate @submit.prevent="guardarFinal">
      <h2 class="tarjeta-formulario-titulo"><GraduationCap :size="20" aria-hidden="true" /> Proyecto final</h2>

      <div class="campo">
        <label class="campo-etiqueta" for="final-titulo">Título</label>
        <input id="final-titulo" v-model="formulario.titulo" class="campo-entrada" required>
      </div>

      <div class="campo">
        <label class="campo-etiqueta" for="final-resumen">Descripción</label>
        <textarea id="final-resumen" v-model="formulario.resumen" class="campo-entrada" rows="3" />
      </div>

      <div class="campo">
        <label class="campo-etiqueta" for="final-tecnologias">Tecnologías</label>
        <input id="final-tecnologias" v-model="formulario.tecnologias" class="campo-entrada" placeholder="Vue, TypeScript, Spring Boot">
        <p class="campo-ayuda">Separadas por comas.</p>
      </div>

      <div class="dos-columnas">
        <div class="campo">
          <label class="campo-etiqueta" for="final-demo">URL de la demo</label>
          <input
            id="final-demo"
            v-model="formulario.urlDemo"
            class="campo-entrada"
            type="url"
            inputmode="url"
            placeholder="https://"
            :aria-invalid="!!errorUrlDemo"
            aria-describedby="final-demo-ayuda"
          >
          <p id="final-demo-ayuda" class="campo-ayuda" :class="{ 'campo-ayuda-error': errorUrlDemo }">
            {{ errorUrlDemo || 'Con esta URL el proyecto pasa a publicado y se puede previsualizar.' }}
          </p>
        </div>

        <div class="campo">
          <label class="campo-etiqueta" for="final-codigo">URL del código fuente</label>
          <input
            id="final-codigo"
            v-model="formulario.urlCodigo"
            class="campo-entrada"
            type="url"
            inputmode="url"
            placeholder="https://github.com/…"
            :aria-invalid="!!errorUrlCodigo"
            aria-describedby="final-codigo-ayuda"
          >
          <p id="final-codigo-ayuda" class="campo-ayuda" :class="{ 'campo-ayuda-error': errorUrlCodigo }">
            {{ errorUrlCodigo || 'Opcional.' }}
          </p>
        </div>
      </div>

      <div class="campo campo-fecha">
        <label class="campo-etiqueta" for="final-fecha">Fecha de entrega</label>
        <input id="final-fecha" v-model="formulario.fechaEntrega" class="campo-entrada" type="date">
      </div>

      <p v-if="avisoProyecto" class="mensaje" :class="`mensaje-${avisoProyecto.tipo}`" role="status">
        <CircleCheck v-if="avisoProyecto.tipo === 'exito'" :size="18" aria-hidden="true" />
        <CircleAlert v-else :size="18" aria-hidden="true" />
        {{ avisoProyecto.texto }}
      </p>

      <div class="tarjeta-formulario-acciones">
        <button type="submit" class="boton boton-primario" :disabled="!formularioValido">
          <Save :size="17" aria-hidden="true" /> Guardar proyecto final
        </button>
        <button type="button" class="boton boton-fantasma" @click="restaurarFinal">
          <RotateCcw :size="17" aria-hidden="true" /> Restaurar valores por defecto
        </button>
      </div>
    </form>

    <section class="tarjeta-formulario" aria-labelledby="titulo-cuentas">
      <h2 id="titulo-cuentas" class="tarjeta-formulario-titulo"><UsersRound :size="20" aria-hidden="true" /> Cuentas</h2>

      <ul class="cuentas">
        <li v-for="cuenta in cuentas" :key="cuenta.usuario" class="cuenta">
          <div class="cuenta-datos">
            <p class="cuenta-nombre">
              {{ cuenta.nombre }}
              <span class="cuenta-rol">{{ cuenta.rol === 'admin' ? 'Administrador' : 'Revisor' }}</span>
            </p>
            <p class="cuenta-detalle">@{{ cuenta.usuario }}. Contraseña cambiada: {{ formatearFecha(cuenta.contrasenaActualizadaEn) }}</p>
          </div>
          <button
            v-if="cuenta.usuario !== usuario?.usuario"
            type="button"
            class="boton boton-secundario"
            @click="restablecer(cuenta)"
          >
            <RotateCcw :size="16" aria-hidden="true" /> Restablecer contraseña
          </button>
          <span v-else class="cuenta-tu">Tu cuenta</span>
        </li>
      </ul>

      <p v-if="avisoCuentas" class="mensaje" :class="`mensaje-${avisoCuentas.tipo}`" role="status">
        <CircleCheck v-if="avisoCuentas.tipo === 'exito'" :size="18" aria-hidden="true" />
        <CircleAlert v-else :size="18" aria-hidden="true" />
        {{ avisoCuentas.texto }}
      </p>
    </section>
  </PaginaFormulario>
</template>

<style scoped>
.dos-columnas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.1rem;
}

.campo-fecha {
  max-width: 240px;
}

.campo-ayuda-error {
  color: var(--rojo);
}

textarea.campo-entrada {
  resize: vertical;
}

.cuentas {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
}

.cuenta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--borde);
}

.cuenta:first-child {
  border-top: none;
  padding-top: 0;
}

.cuenta-nombre {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 650;
  color: var(--azul-tinta);
}

.cuenta-rol {
  padding: 0.05rem 0.55rem;
  border-radius: 999px;
  background-color: var(--azul-niebla);
  color: var(--azul-uasd);
  font-size: 0.75rem;
  font-weight: 600;
}

.cuenta-detalle {
  font-size: 0.85rem;
  color: var(--tinta-suave);
}

.cuenta-tu {
  font-size: 0.85rem;
  color: var(--tinta-suave);
}
</style>
