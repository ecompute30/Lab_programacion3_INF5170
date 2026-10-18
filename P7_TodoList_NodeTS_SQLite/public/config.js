/**
 * Configuración de almacenamiento de la app, a nivel de aplicativo (no por
 * usuario). Este archivo tal cual queda en el repositorio es el que sirve
 * GitHub Pages (sitio estático, sin backend), por eso su valor por defecto
 * es "localStorage".
 *
 * Cuando el servidor Express corre localmente (`npm run dev` / `npm start`),
 * intercepta la ruta /config.js ANTES de llegar a este archivo estático y
 * sirve dinámicamente "api" (o lo que diga la variable de entorno
 * STORAGE_MODE en un .env) — ver src/server.ts.
 */
window.APP_CONFIG = {
  storageMode: 'localStorage', // 'api' | 'localStorage'
};
