import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ImpressumView from '@/views/ImpressumView.vue';
import DatenschutzView from '@/views/DatenschutzView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    alias: '/start',
    name: 'home',
    component: HomeView
  },
  {
    path: '/programm',
    alias: '/programm',
    name: 'Programm',
    component: () => import('@/views/ProgrammView.vue')
  },
  {
    path: '/impressum',
    alias: '/impressum',
    name: 'Impressum',
    component: ImpressumView
  },
  {
    path: '/datenschutz',
    alias: '/datenschutz',
    name: 'Datenschutz',
    component: DatenschutzView
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
