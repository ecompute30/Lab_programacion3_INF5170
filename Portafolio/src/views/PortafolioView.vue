<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { SearchX } from 'lucide-vue-next'
import BarraBusqueda from '../components/BarraBusqueda.vue'
import ModalPrevisualizacion from '../components/ModalPrevisualizacion.vue'
import RecorridoPracticas from '../components/RecorridoPracticas.vue'
import TarjetaProyecto from '../components/TarjetaProyecto.vue'
import TarjetaProyectoFinal from '../components/TarjetaProyectoFinal.vue'
import { useAuth } from '../composables/useAuth'
import { useBusquedaProyectos } from '../composables/useBusquedaProyectos'
import { CURSO } from '../data/marca'
import { cargarProyectoFinal, estaPublicado } from '../services/proyectoFinalStorage'
import type { ElementoVista, Parada, Proyecto } from '../types/proyecto'

const ID_FINAL = 'proyecto-final'

const { usuario, esAdmin } = useAuth()
const nombreUsuario = computed(() => usuario.value?.usuario ?? 'anonimo')
const {
  proyectos,
  consulta,
  categoria,
  resultados,
  conteoPorCategoria,
  hayFiltros,
  recientes,
  limpiarFiltros,
  olvidarRecientes,
} = useBusquedaProyectos(nombreUsuario)

const proyectoFinal = shallowRef(cargarProyectoFinal())
const finalPublicado = computed(() => estaPublicado(proyectoFinal.value))

/* Recorrido del curso */
const paradas = computed<Parada[]>(() => {
  const visibles = new Set(resultados.value.map((p) => p.id))
  const pasos = [...new Set(proyectos.map((p) => p.paso))].sort((a, b) => a - b)
  return [
    ...pasos.map((paso) => {
      const delPaso = proyectos.filter((p) => p.paso === paso)
      return {
        clave: String(paso),
        numero: String(paso),
        descripcion: `Práctica ${paso}: ${delPaso.map((p) => p.titulo).join(', ')}`,
        completada: true,
        visible: delPaso.some((p) => visibles.has(p.id)),
      }
    }),
    {
      clave: 'final',
      numero: 'PF',
      descripcion: `Proyecto final: ${finalPublicado.value ? 'publicado' : 'en preparación'}`,
      completada: finalPublicado.value,
      visible: true,
    },
  ]
})

const idResaltado = shallowRef<string | null>(null)
let temporizadorResaltado: ReturnType<typeof setTimeout> | undefined

function desplazarA(idElemento: string) {
  const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(idElemento)?.scrollIntoView({ behavior: reducirMovimiento ? 'auto' : 'smooth', block: 'center' })
}

async function irAParada(clave: string) {
  if (clave === 'final') {
    desplazarA(ID_FINAL)
    return
  }
  const destino = proyectos.find((p) => String(p.paso) === clave)
  if (!destino) return
  if (!resultados.value.some((p) => p.id === destino.id)) {
    limpiarFiltros()
    await nextTick()
  }
  desplazarA(`proyecto-${destino.id}`)
  clearTimeout(temporizadorResaltado)
  idResaltado.value = null
  await nextTick()
  idResaltado.value = destino.id
  temporizadorResaltado = setTimeout(() => (idResaltado.value = null), 1700)
}

/* Entrada escalonada solo en la primera carga; después las tarjetas entran sin retraso. */
const primeraCarga = shallowRef(true)
let temporizadorCarga: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  temporizadorCarga = setTimeout(() => (primeraCarga.value = false), 900)
})
onBeforeUnmount(() => {
  clearTimeout(temporizadorCarga)
  clearTimeout(temporizadorResaltado)
})

function retrasoEntrada(indice: number) {
  return primeraCarga.value ? { transitionDelay: `${300 + Math.min(indice, 10) * 45}ms` } : undefined
}

const textoResultados = computed(() => {
  const total = proyectos.length
  const encontrados = resultados.value.length
  if (!hayFiltros.value) return `${total} proyectos`
  const termino = consulta.value.trim()
  const sufijo = termino ? ` coinciden con “${termino}”` : ' en esta categoría'
  return `${encontrados} de ${total} proyectos${sufijo}`
})

/* Previsualización */
function aElementoVista(proyecto: Proyecto): ElementoVista {
  return {
    id: proyecto.id,
    etiqueta: `Práctica ${proyecto.practica}`,
    titulo: proyecto.titulo,
    url: proyecto.urlDemo ?? '',
    icono: proyecto.icono,
  }
}

const elementosVista = computed<ElementoVista[]>(() => {
  const elementos = resultados.value.filter((p) => p.urlDemo).map(aElementoVista)
  if (finalPublicado.value) {
    elementos.push({
      id: ID_FINAL,
      etiqueta: 'Proyecto final',
      titulo: proyectoFinal.value.titulo,
      url: proyectoFinal.value.urlDemo,
      icono: 'GraduationCap',
    })
  }
  return elementos
})

const idEnVista = shallowRef<string | null>(null)
const indiceEnVista = computed(() => elementosVista.value.findIndex((e) => e.id === idEnVista.value))
const elementoEnVista = computed(() => elementosVista.value[indiceEnVista.value] ?? null)
const elementoAnterior = computed(() => elementosVista.value[indiceEnVista.value - 1] ?? null)
const elementoSiguiente = computed(() =>
  indiceEnVista.value >= 0 ? (elementosVista.value[indiceEnVista.value + 1] ?? null) : null,
)
</script>

<template>
  <main class="portafolio">
    <section class="hero" aria-labelledby="titulo-portafolio">
      <div class="hero-interior">
        <div class="hero-texto">
          <h1 id="titulo-portafolio" class="hero-titulo">{{ CURSO.nombre }}</h1>
          <p class="hero-descripcion">
            Prácticas de {{ CURSO.estudiante }} ({{ CURSO.matricula }}) para {{ CURSO.codigo }}, con el profesor
            {{ CURSO.profesor }}. Cada proyecto se puede previsualizar aquí mismo, sin salir del portafolio.
          </p>
        </div>
        <RecorridoPracticas :paradas="paradas" @ir="irAParada" />
      </div>
    </section>

    <section class="catalogo" aria-labelledby="titulo-catalogo">
      <div class="catalogo-cabecera">
        <h2 id="titulo-catalogo" class="catalogo-titulo">Prácticas</h2>
        <p class="catalogo-conteo" aria-live="polite">{{ textoResultados }}</p>
      </div>

      <BarraBusqueda
        v-model:consulta="consulta"
        v-model:categoria="categoria"
        :conteo-por-categoria="conteoPorCategoria"
        :recientes="recientes"
        @olvidar-recientes="olvidarRecientes"
      />

      <TransitionGroup tag="div" name="lista" class="rejilla" appear>
        <TarjetaProyecto
          v-for="(proyecto, indice) in resultados"
          :key="proyecto.id"
          :proyecto="proyecto"
          :consulta="consulta"
          :resaltada="idResaltado === proyecto.id"
          :style="retrasoEntrada(indice)"
          @previsualizar="idEnVista = $event.id"
        />
      </TransitionGroup>

      <Transition name="vacio">
        <div v-if="resultados.length === 0" class="vacio">
          <SearchX :size="34" :stroke-width="1.6" aria-hidden="true" />
          <p class="vacio-titulo">Ningún proyecto coincide con tu búsqueda</p>
          <p class="vacio-texto">Prueba con una tecnología, como Vue o Playwright, o con un número de práctica.</p>
          <button type="button" class="boton boton-secundario" @click="limpiarFiltros">Quitar filtros</button>
        </div>
      </Transition>
    </section>

    <section class="seccion-final" aria-label="Proyecto final">
      <TarjetaProyectoFinal :proyecto="proyectoFinal" :puede-editar="esAdmin" @previsualizar="idEnVista = ID_FINAL" />
    </section>

    <footer class="pie">
      <p>
        © 2026 {{ CURSO.estudiante }}. Código fuente en
        <a href="https://github.com/ecompute30/Lab_programacion3_INF5170" target="_blank" rel="noopener noreferrer">GitHub</a>.
      </p>
    </footer>

    <ModalPrevisualizacion
      :elemento="elementoEnVista"
      :anterior="elementoAnterior"
      :siguiente="elementoSiguiente"
      @cerrar="idEnVista = null"
      @navegar="idEnVista = $event"
    />
  </main>
</template>

<style scoped>
.portafolio {
  --ancho: 1180px;
  --margen: clamp(1rem, 4vw, 3rem);
}

.hero {
  background-color: var(--blanco);
  border-bottom: 1px solid var(--borde);
}

.hero-interior {
  max-width: var(--ancho);
  margin: 0 auto;
  padding: clamp(2.25rem, 6vw, 4rem) var(--margen) 2.25rem;
  display: grid;
  gap: 2.25rem;
}

.hero-texto {
  display: grid;
  gap: 0.9rem;
  animation: aparecer 600ms var(--ease-out) both;
}

.hero-titulo {
  font-size: clamp(2.3rem, 5.6vw, 4rem);
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1;
  max-width: 16ch;
}

.hero-descripcion {
  max-width: 62ch;
  font-size: 1.05rem;
  color: var(--tinta-suave);
}

.catalogo {
  max-width: var(--ancho);
  margin: 0 auto;
  padding: 2.5rem var(--margen) 0;
  display: grid;
  gap: 1.25rem;
}

.catalogo-cabecera {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.catalogo-titulo {
  font-size: 1.6rem;
  letter-spacing: -0.02em;
}

.catalogo-conteo {
  color: var(--tinta-suave);
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
  gap: 1.15rem;
  padding-top: 0.4rem;
}

.lista-enter-active {
  transition: opacity 420ms var(--ease-out), transform 420ms var(--ease-out);
}

.lista-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.lista-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

.lista-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

.lista-move {
  transition: transform 380ms var(--ease-in-out);
}

.vacio {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--tinta-suave);
  border: 1px dashed var(--borde);
  border-radius: var(--radio-tarjeta);
  background-color: var(--blanco);
}

.vacio-titulo {
  font-family: var(--fuente-titulos);
  font-size: 1.15rem;
  font-weight: 650;
  color: var(--azul-tinta);
}

.vacio-texto {
  max-width: 46ch;
  margin-bottom: 0.6rem;
}

.vacio-enter-active {
  transition: opacity 260ms 120ms var(--ease-out), transform 260ms 120ms var(--ease-out);
}

.vacio-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.seccion-final {
  max-width: var(--ancho);
  margin: 0 auto;
  padding: 2.75rem var(--margen) 0;
}

.pie {
  max-width: var(--ancho);
  margin: 0 auto;
  padding: 3rem var(--margen) 2.5rem;
  color: var(--tinta-suave);
  font-size: 0.875rem;
}

@keyframes aparecer {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>
