<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef } from 'vue'
import { CircleAlert, CircleCheck, Cpu, Database, Eye, EyeOff, FlaskConical, LoaderCircle, ShieldCheck, Trash2 } from 'lucide-vue-next'
import PaginaFormulario from '../components/PaginaFormulario.vue'
import { useConfiguracion } from '../composables/useConfiguracion'
import { cargarCorpus, type CorpusCargado } from '../services/corpus'
import type { IdProveedor, ResultadoPrueba } from '../services/llm/tipos'

type ProveedorConClave = Exclude<IdProveedor, 'extractivo'>

const config = useConfiguracion()

const formulario = reactive({
  principal: config.configuracion.value.ordenProveedores[0] as ProveedorConClave,
  modeloGemini: config.configuracion.value.modeloGemini,
  modeloGroq: config.configuracion.value.modeloGroq,
  mostrarTraza: config.configuracion.value.mostrarTraza,
})
const claves = reactive<Record<ProveedorConClave, string>>({ gemini: '', groq: '' })
const visibles = reactive<Record<ProveedorConClave, boolean>>({ gemini: false, groq: false })
const probando = reactive<Record<IdProveedor, boolean>>({ gemini: false, groq: false, extractivo: false })
const resultados = reactive<Partial<Record<IdProveedor, ResultadoPrueba>>>({})
const avisoGuardado = shallowRef('')
const corpus = shallowRef<CorpusCargado | null>(null)
const errorCorpus = shallowRef('')

const PROVEEDORES: Array<{ id: ProveedorConClave; nombre: string; ayuda: string; enlace: string }> = [
  {
    id: 'gemini',
    nombre: 'Google Gemini (principal recomendado)',
    ayuda: 'Gratis con límites diarios. Restrinja la clave en Google Cloud a la API Generative Language y a los dominios de esta app.',
    enlace: 'https://aistudio.google.com/apikey',
  },
  {
    id: 'groq',
    nombre: 'Groq (respaldo)',
    ayuda: 'Modelos abiertos gratuitos con límites por día. Se usa solo si Gemini falla.',
    enlace: 'https://console.groq.com/keys',
  },
]

const estadoDe = (id: IdProveedor) => config.estados.value.find((e) => e.id === id)
const origenLegible: Record<string, string> = {
  dispositivo: 'Clave guardada en este dispositivo',
  build: 'Clave incluida en el build (.env)',
  ninguno: 'Sin clave',
}

onMounted(async () => {
  await config.cargarEstados()
  try {
    corpus.value = await cargarCorpus()
  } catch (error) {
    errorCorpus.value = error instanceof Error ? error.message : String(error)
  }
})

function guardarOpciones() {
  const otro: ProveedorConClave = formulario.principal === 'gemini' ? 'groq' : 'gemini'
  config.guardar({
    ordenProveedores: [formulario.principal, otro, 'extractivo'],
    modeloGemini: formulario.modeloGemini.trim() || 'gemini-3.5-flash-lite',
    modeloGroq: formulario.modeloGroq.trim() || 'llama-3.3-70b-versatile',
    mostrarTraza: formulario.mostrarTraza,
  })
  config.cargarEstados()
  avisoGuardado.value = 'Opciones guardadas.'
  setTimeout(() => (avisoGuardado.value = ''), 2500)
}

async function guardarClave(id: ProveedorConClave) {
  if (!claves[id].trim()) return
  await config.guardarClave(id, claves[id])
  claves[id] = ''
  delete resultados[id]
}

async function quitarClave(id: ProveedorConClave) {
  if (!confirm('¿Quitar la clave guardada en este dispositivo?')) return
  await config.borrarClave(id)
  delete resultados[id]
}

async function probar(id: IdProveedor) {
  probando[id] = true
  try {
    resultados[id] = await config.probar(id)
  } finally {
    probando[id] = false
  }
}

const resumenCorpus = computed(() => {
  const c = corpus.value
  if (!c) return null
  return {
    articulos: c.corpus.meta.totalArticulos,
    unidades: c.corpus.meta.totalUnidades,
    glosario: c.corpus.glosario.length,
    generado: new Date(c.corpus.meta.generado).toLocaleDateString('es-DO', { dateStyle: 'medium' }),
    embeddings: c.embeddings ? `${c.embeddings.meta.total} vectores · ${c.embeddings.meta.modelo} · ${c.embeddings.meta.dimensiones} dimensiones` : null,
    aviso: c.avisoEmbeddings,
  }
})
</script>

<template>
  <PaginaFormulario
    titulo="Configuración de la inteligencia artificial"
    descripcion="Las claves se guardan cifradas en este navegador y nunca se envían a otro sitio que no sea el proveedor elegido. Si usa otro equipo el día de la demostración, deberá ingresarlas de nuevo allí."
  >
    <section v-for="p in PROVEEDORES" :key="p.id" class="tarjeta-formulario" :aria-labelledby="`titulo-${p.id}`">
      <header class="proveedor-cabecera">
        <h2 :id="`titulo-${p.id}`" class="tarjeta-formulario-titulo"><Cpu :size="20" aria-hidden="true" /> {{ p.nombre }}</h2>
        <span class="estado" :class="estadoDe(p.id)?.disponible ? 'estado-ok' : 'estado-no'">
          {{ origenLegible[estadoDe(p.id)?.origenClave ?? 'ninguno'] }}
        </span>
      </header>
      <p class="campo-ayuda">{{ p.ayuda }} <a :href="p.enlace" target="_blank" rel="noopener noreferrer">Obtener clave</a>.</p>

      <div class="campo">
        <label class="campo-etiqueta" :for="`clave-${p.id}`">{{ estadoDe(p.id)?.origenClave === 'dispositivo' ? 'Reemplazar clave' : 'Clave de API' }}</label>
        <div class="fila">
          <div class="clave">
            <input
              :id="`clave-${p.id}`"
              v-model="claves[p.id]"
              class="campo-entrada"
              :type="visibles[p.id] ? 'text' : 'password'"
              autocomplete="off"
              spellcheck="false"
              placeholder="Pegue aquí la clave"
            >
            <button type="button" class="alternar" :aria-label="visibles[p.id] ? 'Ocultar' : 'Mostrar'" @click="visibles[p.id] = !visibles[p.id]">
              <EyeOff v-if="visibles[p.id]" :size="17" aria-hidden="true" />
              <Eye v-else :size="17" aria-hidden="true" />
            </button>
          </div>
          <button type="button" class="boton boton-primario" :disabled="!claves[p.id].trim()" @click="guardarClave(p.id)">Guardar clave</button>
          <button v-if="estadoDe(p.id)?.origenClave === 'dispositivo'" type="button" class="boton boton-fantasma" @click="quitarClave(p.id)">
            <Trash2 :size="16" aria-hidden="true" /> Quitar
          </button>
        </div>
      </div>

      <div class="campo">
        <label class="campo-etiqueta" :for="`modelo-${p.id}`">Modelo</label>
        <input v-if="p.id === 'gemini'" :id="`modelo-${p.id}`" v-model="formulario.modeloGemini" class="campo-entrada modelo" spellcheck="false">
        <input v-else :id="`modelo-${p.id}`" v-model="formulario.modeloGroq" class="campo-entrada modelo" spellcheck="false">
      </div>

      <div class="tarjeta-formulario-acciones">
        <button type="button" class="boton boton-secundario" :disabled="probando[p.id] || !estadoDe(p.id)?.disponible" @click="probar(p.id)">
          <LoaderCircle v-if="probando[p.id]" class="girando" :size="16" aria-hidden="true" />
          <FlaskConical v-else :size="16" aria-hidden="true" />
          Probar conexión
        </button>
        <p v-if="resultados[p.id]" class="mensaje" :class="resultados[p.id]!.ok ? 'mensaje-exito' : 'mensaje-error'" role="status">
          <CircleCheck v-if="resultados[p.id]!.ok" :size="17" aria-hidden="true" />
          <CircleAlert v-else :size="17" aria-hidden="true" />
          {{ resultados[p.id]!.detalle }} ({{ resultados[p.id]!.latenciaMs }} ms)
        </p>
      </div>
    </section>

    <form class="tarjeta-formulario" @submit.prevent="guardarOpciones">
      <h2 class="tarjeta-formulario-titulo"><ShieldCheck :size="20" aria-hidden="true" /> Orden y demostración</h2>

      <fieldset class="campo opciones">
        <legend class="campo-etiqueta">Proveedor principal</legend>
        <label class="opcion"><input v-model="formulario.principal" type="radio" value="gemini"> Gemini, luego Groq, luego búsqueda sin IA</label>
        <label class="opcion"><input v-model="formulario.principal" type="radio" value="groq"> Groq, luego Gemini, luego búsqueda sin IA</label>
      </fieldset>

      <label class="opcion">
        <input v-model="formulario.mostrarTraza" type="checkbox">
        Mostrar la traza técnica del RAG bajo cada respuesta (útil para la presentación)
      </label>

      <div class="tarjeta-formulario-acciones">
        <button type="submit" class="boton boton-primario">Guardar opciones</button>
        <p v-if="avisoGuardado" class="mensaje mensaje-exito" role="status"><CircleCheck :size="17" aria-hidden="true" /> {{ avisoGuardado }}</p>
      </div>
    </form>

    <section class="tarjeta-formulario" aria-labelledby="titulo-corpus">
      <h2 id="titulo-corpus" class="tarjeta-formulario-titulo"><Database :size="20" aria-hidden="true" /> Estatuto procesado</h2>
      <p v-if="errorCorpus" class="mensaje mensaje-error"><CircleAlert :size="17" aria-hidden="true" /> {{ errorCorpus }}</p>
      <dl v-else-if="resumenCorpus" class="datos">
        <div><dt>Artículos</dt><dd>{{ resumenCorpus.articulos }}</dd></div>
        <div><dt>Unidades indexadas</dt><dd>{{ resumenCorpus.unidades }}</dd></div>
        <div><dt>Términos del glosario</dt><dd>{{ resumenCorpus.glosario }}</dd></div>
        <div><dt>Generado</dt><dd>{{ resumenCorpus.generado }}</dd></div>
        <div class="ancho"><dt>Embeddings</dt><dd>{{ resumenCorpus.embeddings ?? resumenCorpus.aviso }}</dd></div>
      </dl>
      <p v-else class="campo-ayuda">Cargando…</p>
    </section>
  </PaginaFormulario>
</template>

<style scoped>
.proveedor-cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.estado {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
}

.estado-ok {
  background-color: #e6f4ec;
  color: var(--verde);
}

.estado-no {
  background-color: var(--papel);
  color: var(--tinta-suave);
}

.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.clave {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.clave .campo-entrada {
  padding-right: 2.6rem;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 0.9rem;
}

.alternar {
  position: absolute;
  inset: 0 0.3rem 0 auto;
  margin: auto 0;
  width: 2.1rem;
  height: 2.1rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--tinta-suave);
  cursor: pointer;
}

.modelo {
  max-width: 320px;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
  font-size: 0.9rem;
}

.opciones {
  border: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.4rem;
}

.opcion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.92rem;
}

.datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.datos .ancho {
  grid-column: 1 / -1;
}

dt {
  font-size: 0.78rem;
  color: var(--tinta-suave);
}

dd {
  margin: 0;
  font-weight: 600;
  color: var(--azul-tinta);
}
</style>
