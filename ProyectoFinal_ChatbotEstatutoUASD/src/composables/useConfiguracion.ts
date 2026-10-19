import { computed, readonly, shallowRef } from 'vue'
import {
  borrarSecreto,
  existeSecreto,
  guardarConfiguracion,
  guardarSecreto,
  leerConfiguracion,
  type ConfiguracionLLM,
} from '../services/configStorage.ts'
import { construirCadena, type CadenaProveedores, type EstadoProveedor } from '../services/llm/cadenaProveedores.ts'
import type { IdProveedor, ResultadoPrueba } from '../services/llm/tipos.ts'

type ProveedorConClave = Exclude<IdProveedor, 'extractivo'>

// Estado compartido por toda la app: la cadena se reconstruye solo cuando cambia la configuración o una clave.
const configuracion = shallowRef<ConfiguracionLLM>(leerConfiguracion())
const estados = shallowRef<EstadoProveedor[]>([])
let cadena: Promise<CadenaProveedores> | null = null

function invalidarCadena() {
  cadena = null
}

export function obtenerCadena(): Promise<CadenaProveedores> {
  cadena ??= construirCadena(configuracion.value).then((c) => {
    estados.value = c.estados
    return c
  })
  return cadena
}

export function useConfiguracion() {
  const proveedorActivo = computed(() => estados.value.find((e) => e.disponible && e.id !== 'extractivo') ?? null)
  const sinIA = computed(() => estados.value.length > 0 && !proveedorActivo.value)

  function guardar(cambios: Partial<ConfiguracionLLM>) {
    configuracion.value = { ...configuracion.value, ...cambios }
    guardarConfiguracion(configuracion.value)
    invalidarCadena()
  }

  async function guardarClave(proveedor: ProveedorConClave, valor: string) {
    await guardarSecreto(proveedor, valor.trim())
    invalidarCadena()
    await obtenerCadena()
  }

  async function borrarClave(proveedor: ProveedorConClave) {
    borrarSecreto(proveedor)
    invalidarCadena()
    await obtenerCadena()
  }

  async function probar(proveedor: IdProveedor): Promise<ResultadoPrueba> {
    const c = await obtenerCadena()
    const p = c.proveedores.find((x) => x.id === proveedor)
    return p ? p.probar() : { ok: false, latenciaMs: 0, detalle: 'Proveedor no configurado.' }
  }

  return {
    configuracion: readonly(configuracion),
    estados: readonly(estados),
    proveedorActivo,
    sinIA,
    tieneClaveEnDispositivo: (proveedor: ProveedorConClave) => existeSecreto(proveedor),
    cargarEstados: obtenerCadena,
    guardar,
    guardarClave,
    borrarClave,
    probar,
  }
}
