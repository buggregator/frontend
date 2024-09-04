import {storeToRefs} from "pinia";
import {useProfileStore, useSettingsStore} from "@/shared/stores";
import  {type TRouterMiddleware, RouteName} from "./types";


export const auth: TRouterMiddleware = async ({ to, next }) => {
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
    try {
      await profileStore.getProfile();
    } catch (e) {
      console.error(e);

      return next({
        name: RouteName.Login,
      })
    }
  }

  if (to.name !== 'login' && !isAuthenticated.value) {
    return next({
      name: RouteName.Login,
    })
  }

  if (to.name === 'login' && to?.query?.token) {
    profileStore.setToken(String(to.query.token))
    return next({
      name: RouteName.Home,
    })
  }

  return undefined
}

