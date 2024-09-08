import {storeToRefs} from "pinia";
import { RouteAuthAccessError} from "@/shared/lib/errors";
import {useProfileStore, useSettingsStore} from "@/shared/stores";
import { type TRouterMiddleware} from "./types";


export const auth: TRouterMiddleware = async ({ to, next }) => {
  const settingsStore  = useSettingsStore()
  const {isFetched, isAuthEnabled }  = storeToRefs(settingsStore)

  if (!isFetched.value) {
    await settingsStore.fetchSettings()
  }

  if (!isAuthEnabled.value) {
    return
  }

  const profileStore = useProfileStore()
  const { isAuthenticated}  = storeToRefs(profileStore)

  await profileStore.getStoredToken()

  if (isAuthenticated.value) {
    try {
      await profileStore.getProfile();
    } catch (e) {
      console.error(e);

      next({
        name: 'login',
      })

      return new RouteAuthAccessError(`Access denied`, to.path)
    }
  }

  if (to.name !== 'login' && !isAuthenticated.value) {
    return new RouteAuthAccessError(`Access denied`, to.path)
  }

  if (to.name === 'login' && to?.query?.token) {
    profileStore.setToken(String(to.query.token))
  }

  return
}

