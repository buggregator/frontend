import { useNuxtApp, navigateTo } from "#app"

export default defineNuxtRouteMiddleware(async (to, from) => {
  const app = useNuxtApp()
  const {localStorage} = window;

  if (!app.$appSettings.auth.enabled) {
    return;
  }

  // todo: move token to a store
  if (to.name !== 'login' && !app.$authToken.token) {
    return navigateTo('/login');
  }

  if (to.name === 'login' && to?.query?.token) {
    localStorage?.setItem('token', to.query.token);
    // todo: use store
    app.$authToken.token = to.query.token;
    return navigateTo('/');
  }
})
