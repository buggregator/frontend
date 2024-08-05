import { navigateTo, defineNuxtRouteMiddleware } from "#app";
import {useSettingsStore, useProfileStore} from "~/src/shared/stores";

export default defineNuxtRouteMiddleware(async (to) => {
  const settingsStore  = useSettingsStore()
  const {isFetched, isAuthEnabled }  = storeToRefs(settingsStore)

  if (!isFetched.value) {
    await settingsStore.fetchSettings()
  }

  if (!isAuthEnabled.value) {
    return undefined
  }

  const profileStore = useProfileStore()
  const { isAuthenticated}  = storeToRefs(profileStore)
  await profileStore.getStoredToken()

  if (isAuthenticated.value) {
    await profileStore.getProfile();
  }

  if (to.name !== 'login' && !isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (to.name === 'login' && to?.query?.token) {
    profileStore.setToken(String(to.query.token))
    return navigateTo('/')
  }

  return undefined
})
