# Menú Dinámico Uastiano — Vue 3 + TypeScript

Práctica 4 del laboratorio: un menú de navegación generado dinámicamente a partir de una
estructura de datos en JSON, construido con **Vue 3** (Composition API, `<script setup>`)
y **TypeScript**. Reutiliza la identidad visual (colores y logo de la UASD) de la actividad
del Banco Uastiano.

## Cómo cumple los requerimientos

- **Estructura de datos**: el menú se define en [`src/data/menu.json`](src/data/menu.json)
  siguiendo el formato `{ "menu": [ { "id", "nombre", "enlace", "icono"?, "submenu"? } ] }`.
- **Interfaz dinámica**: el componente [`MenuItemNode.vue`](src/components/MenuItemNode.vue)
  renderiza recursivamente cada opción (y sus submenús) a partir del estado reactivo.
- **Agregar/editar/eliminar sin tocar código**: el panel "Administración del menú"
  ([`MenuEditorForm.vue`](src/components/MenuEditorForm.vue)) permite agregar o editar
  opciones mediante un formulario; cada opción tiene botones ✎ (editar) y ✕ (eliminar).
- **Importar JSON**: [`JsonImporter.vue`](src/components/JsonImporter.vue) permite adjuntar
  un archivo `.json` o pegar el texto directamente, reemplazando todo el menú. También
  permite exportar el menú actual y restaurar el original.
- **Actualización sin recargar**: todo el estado vive en el composable
  [`useMenu.ts`](src/composables/useMenu.ts) (reactividad de Vue); ningún cambio dispara
  una recarga de página.
- **Validaciones**: id único autogenerado al agregar, rechazo de ids duplicados al
  importar JSON, y validación de que el enlace sea una ruta interna (`/algo`) o una URL
  `http(s)` — se descartan esquemas como `javascript:` para evitar XSS.
- **Responsive**: el menú colapsa a un botón de hamburguesa en pantallas angostas
  (`AppHeader.vue` + `MenuBar.vue`).
- **Eventos**: cada opción emite un evento `seleccionar` que actualiza el panel de
  contenido (`ContentPanel.vue`) sin navegar a otra página; `editar` y `eliminar`
  disparan las acciones correspondientes sobre el estado del menú.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo con recarga en caliente
npm run build    # type-check (vue-tsc) + build de producción en dist/
npm run preview  # sirve dist/ localmente para verificar el build
```

La carpeta `dist/` generada por `npm run build` se versiona junto al código fuente para
poder publicarla directamente en GitHub Pages sin un paso de build en el servidor.
