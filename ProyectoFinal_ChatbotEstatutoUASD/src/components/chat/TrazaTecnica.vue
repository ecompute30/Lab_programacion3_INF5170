<script setup lang="ts">
import { computed } from 'vue'
import { FlaskConical } from 'lucide-vue-next'
import type { TrazaRespuesta } from '../../composables/useChat'

const { traza } = defineProps<{ traza: TrazaRespuesta }>()

const formato = (n: number) => n.toFixed(3)
const top = (lista: Array<{ id: string; puntaje: number }> | null, n = 6) => (lista ?? []).slice(0, n)
const resumenProveedor = computed(() => (traza.proveedor ? `${traza.proveedor} · ${traza.modelo}` : 'sin proveedor'))
</script>

<template>
  <details class="traza">
    <summary class="resumen">
      <FlaskConical :size="15" aria-hidden="true" />
      Traza técnica del RAG · {{ resumenProveedor }} · {{ (traza.duracionMs / 1000).toFixed(1) }} s
      <span v-if="traza.tokensEntrada">· {{ traza.tokensEntrada }} tokens de entrada, {{ traza.tokensSalida ?? '?' }} de salida</span>
    </summary>

    <div class="contenido">
      <section>
        <h4>1. Consulta de búsqueda</h4>
        <p><code>{{ traza.recuperacion.consultaEfectiva }}</code></p>
      </section>

      <section class="columnas">
        <div>
          <h4>2a. BM25 (léxico)</h4>
          <ol>
            <li v-for="r in top(traza.recuperacion.bm25)" :key="r.id"><code>{{ r.id }}</code> <span>{{ formato(r.puntaje) }}</span></li>
          </ol>
        </div>
        <div>
          <h4>2b. Vectorial (embeddings)</h4>
          <p v-if="!traza.recuperacion.usoVectorial" class="nota">
            No se usó{{ traza.recuperacion.errorVectorial ? `: ${traza.recuperacion.errorVectorial}` : ' (sin embeddings o sin proveedor que embeba la consulta).' }}
          </p>
          <ol v-else>
            <li v-for="r in top(traza.recuperacion.vectorial)" :key="r.id"><code>{{ r.id }}</code> <span>{{ formato(r.puntaje) }}</span></li>
          </ol>
        </div>
      </section>

      <section>
        <h4>3. Contexto entregado al modelo ({{ traza.fragmentos.length }} fragmentos)</h4>
        <ol>
          <li v-for="f in traza.fragmentos" :key="f.id"><code>{{ f.id }}</code> {{ f.encabezado }}</li>
        </ol>
      </section>

      <section v-if="traza.intentosFallidos.length">
        <h4>4. Proveedores que fallaron antes</h4>
        <ul>
          <li v-for="i in traza.intentosFallidos" :key="i.proveedor">{{ i.nombre }} — {{ i.error.tipo }}: {{ i.error.message }}</li>
        </ul>
      </section>
    </div>
  </details>
</template>

<style scoped>
.traza {
  margin-left: calc(32px + 0.75rem);
  border: 1px dashed var(--borde);
  border-radius: 12px;
  background-color: var(--blanco);
  font-size: 0.82rem;
}

.resumen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  color: var(--tinta-suave);
  list-style: none;
}

.resumen::-webkit-details-marker {
  display: none;
}

.traza[open] .resumen {
  color: var(--azul-uasd);
  border-bottom: 1px dashed var(--borde);
}

.contenido {
  display: grid;
  gap: 0.8rem;
  padding: 0.8rem;
}

.columnas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.8rem;
}

h4 {
  font-family: var(--fuente-texto);
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--azul-tinta);
  margin-bottom: 0.3rem;
}

ol,
ul {
  margin: 0;
  padding-left: 1.2rem;
}

li {
  display: list-item;
}

li span {
  color: var(--tinta-suave);
  font-variant-numeric: tabular-nums;
}

code {
  font-size: 0.78rem;
  background-color: var(--papel);
  padding: 0.05rem 0.3rem;
  border-radius: 4px;
}

.nota {
  color: var(--tinta-suave);
}

@media (max-width: 600px) {
  .traza {
    margin-left: 0;
  }
}
</style>
