import { createRouter, createWebHistory } from 'vue-router'
import LoginMain from '../components/login/LoginMain.vue'
import Dashboard from '../Dashboard.vue'
import ProductListing from '../pages/dashboard/ProductListing.vue'
import MasterList from '../pages/dashboard/MasterList.vue'

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
    children: [
      { path: '', redirect: '/dashboard/products' },
      { path: 'products', name: 'ProductListing', component: ProductListing },
      { path: 'master', name: 'MasterList', component: MasterList },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
