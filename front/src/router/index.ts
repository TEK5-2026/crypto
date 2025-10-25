import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Exchange',
      component: () => import('../views/Pages/TokenExchange.vue'),
      meta: { title: 'Token Exchange' },
    },
    {
      path: '/exchange',
      name: 'ExchangeAlias',
      component: () => import('../views/Pages/TokenExchange.vue'),
      meta: { title: 'Token Exchange' },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `Vue.js ${to.meta.title} | TailAdmin - Vue.js Tailwind CSS Dashboard Template`
  next()
})
