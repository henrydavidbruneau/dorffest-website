import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ImpressumView from '@/views/ImpressumView.vue';
import DatenschutzView from '@/views/DatenschutzView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/impressum',
    name: 'Impressum',
    component: ImpressumView
  },
  {
    path: '/datenschutz',
    name: 'Datenschutz',
    component: DatenschutzView
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
