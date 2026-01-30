import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// Determine if it is a different build mode
const isDeployMode = import.meta.env.MODE === 'deploy'

// Use lazy loading for deployment
const deployRoutes = [
  {
    path: '/',
    name: 'preview',
    component: () => import('@/views/stage/preview.vue')
  },
  {
    path: '/preview/:previewId',
    name: 'previewWithId',
    component: () => import('@/views/stage/preview.vue')
  },
  // Redirect all other paths to the homepage
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
  // All other paths return 404
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue') // Lazy loading 404 Page
  }
]

// Routing configuration in development and production modes Use lazy loading
const normalRoutes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue')
  },
  {
    path: '/build/:buildId',
    name: 'build',
    component: () => import('@/views/stage/editor.vue'),
    meta: { darkTheme: false }
  },
  {
    path: '/preview/:previewId',
    name: 'preview',
    component: () => import('@/views/stage/preview.vue')
  },
  // All other paths return 404
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue') // Lazy loading 404 Page
  }
]
// Select routing configuration according to build mode
let routes = isDeployMode ? deployRoutes : normalRoutes

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: routes
})

// Route guard，Dynamically add or remove dark theme
router.beforeEach((to, from, next) => {
  if (to.meta.darkTheme) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  next()
})

export default router