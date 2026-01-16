import { createRouter, createWebHistory } from 'vue-router'
import LoginMain from '../components/login/LoginMain.vue'
import Dashboard from '../Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginMain,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
