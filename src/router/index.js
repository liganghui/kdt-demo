import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

// 判断是否为不同的构建模式
const isDeployMode = import.meta.env.MODE === 'deploy'

// 部署使用懒加载
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
  // 将所有其他路径重定向到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  },
  // 其他所有路径返回 404
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue') // 懒加载 404 页面
  }
]

// 开发和生产模式下的路由配置 使用懒加载
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
  // 其他所有路径返回 404
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFound.vue') // 懒加载 404 页面
  }
]
// 根据构建模式选择路由配置
let routes = isDeployMode ? deployRoutes : normalRoutes

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: routes
})

// 路由守卫，动态添加或移除黑色主题
router.beforeEach((to, from, next) => {
  if (to.meta.darkTheme) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  next()
})

export default router