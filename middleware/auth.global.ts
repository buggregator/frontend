import { useNuxtApp, navigateTo } from "#app"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const app = useNuxtApp()
  const {localStorage} = window;

  if (!app.$appSettings.auth.enabled) {
    return;
  }

  if (to.name !== 'login' && !app.$authToken.token) {
    return navigateTo('/login');
  }

  if (to.name === 'login' && to?.query?.token) {
    localStorage?.setItem('token', to.query.token);
    app.$authToken.token = to.query.token;
    return navigateTo('/');
  }
})
