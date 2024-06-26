import { useNuxtApp, navigateTo, defineNuxtRouteMiddleware } from "#app";
import { useSettings } from "~/src/shared/lib/use-settings";
import { useProfileStore } from "~/src/shared/stores/profile"

export default defineNuxtRouteMiddleware(async (to) => {
  const app = useNuxtApp()

  // TODO: need to use settingsStore instead of nuxt plugin
  if (!app.$appSettings?.auth?.enabled) {
    return undefined
  }

  const store = useProfileStore()
  store.fetchToken()

  if (store.isAuthenticated) {
    const {api: {getProfile}} = useSettings();
    const profile = await getProfile();
    store.setProfile(profile)
    return undefined
  }

  if (to.name !== 'login' && !store.isAuthenticated) {
    return navigateTo('/login')
  }

  if (to.name === 'login' && to?.query?.token) {
    store.setToken(String(to.query.token))
    return navigateTo('/')
  }

  return undefined
})
