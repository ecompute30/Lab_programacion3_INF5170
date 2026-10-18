import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from './composables/useAuth'
import ChatView from './views/ChatView.vue'
import LoginView from './views/LoginView.vue'

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
    { path: '/', name: 'chat', component: ChatView, meta: { titulo: 'Conversación' } },
    { path: '/c/:id', name: 'conversacion', component: ChatView, meta: { titulo: 'Conversación' } },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('./views/ConfiguracionView.vue'),
      meta: { soloAdmin: true, titulo: 'Configuración' },
    },
    {
      path: '/cuenta',
      name: 'cuenta',
      component: () => import('./views/CuentaView.vue'),
      meta: { titulo: 'Cambiar contraseña' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((destino) => {
  const { refrescarSesion } = useAuth()
  const sesion = refrescarSesion()

  if (!destino.meta.publica && !sesion) {
    return { name: 'login', query: destino.fullPath !== '/' ? { volver: destino.fullPath } : {} }
  }
  if (destino.name === 'login' && sesion) return { name: 'chat' }
  if (destino.meta.soloAdmin && sesion?.usuario.rol !== 'admin') return { name: 'chat' }
})

router.afterEach((destino) => {
  document.title = `${destino.meta.titulo ?? 'Primada'} — Primada · Estatuto Orgánico UASD`
})
