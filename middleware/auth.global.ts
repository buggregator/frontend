import { navigateTo, defineNuxtRouteMiddleware } from "#app";
import { useSettings } from "~/src/shared/lib/use-settings";
import {useSettingsStore} from "~/src/shared/stores";
import { useProfileStore } from "~/src/shared/stores/profile"

export default defineNuxtRouteMiddleware(async (to) => {
  const { auth}  = storeToRefs(useSettingsStore())

  if (!auth.value.isEnabled) {
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
