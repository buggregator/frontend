import { navigateTo, defineNuxtRouteMiddleware } from "#app";
import { useSettings } from "~/src/shared/lib/use-settings";
import {useSettingsStore, useProfileStore} from "~/src/shared/stores";

export default defineNuxtRouteMiddleware(async (to) => {
  const { auth}  = storeToRefs(useSettingsStore())

  if (!auth.value.isEnabled) {
    return undefined
  }

  const store = useProfileStore()
  const { isAuthenticated}  = storeToRefs(store)
  store.fetchToken()

  if (isAuthenticated.value) {
    const {api: {getProfile}} = useSettings();
    const profile = await getProfile();
    store.setProfile(profile)
    return undefined
  }

  if (to.name !== 'login' && !isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (to.name === 'login' && to?.query?.token) {
    store.setToken(String(to.query.token))
    return navigateTo('/')
  }

  return undefined
})
