import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'
import LoginView from './views/LoginView.vue'
import PortafolioView from './views/PortafolioView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean
    soloAdmin?: boolean
    titulo?: string
  }
}

// Hash history: GitHub Pages solo sirve archivos estáticos y no reescribe rutas.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { publica: true, titulo: 'Iniciar sesión' } },
    { path: '/', name: 'portafolio', component: PortafolioView, meta: { titulo: 'Prácticas' } },
    {
      path: '/cuenta',
      name: 'cuenta',
      component: () => import('./views/CuentaView.vue'),
      meta: { titulo: 'Cambiar contraseña' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('./views/AdminView.vue'),
      meta: { soloAdmin: true, titulo: 'Administración' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((destino) => {
  const { refrescarSesion } = useAuth()
  const sesion = refrescarSesion()

  if (!destino.meta.publica && !sesion) {
    return { name: 'login', query: destino.fullPath !== '/' ? { volver: destino.fullPath } : {} }
  }
  if (destino.name === 'login' && sesion) return { name: 'portafolio' }
  if (destino.meta.soloAdmin && sesion?.usuario.rol !== 'admin') return { name: 'portafolio' }
})

router.afterEach((destino) => {
  document.title = `${destino.meta.titulo ?? 'Portafolio'} — Portafolio INF-5170 UASD`
})
