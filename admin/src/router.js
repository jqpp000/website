import Vue from 'vue';
import Router from 'vue-router';
import AdminDashboard from './views/Dashboard.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  base: process.env.ADMIN_PATH || '/admin',
  routes: [
    { path: '/', component: AdminDashboard }
  ]
});

export default router;