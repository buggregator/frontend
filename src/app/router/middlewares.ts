import {storeToRefs} from "pinia";
import type {RouteLocationNormalized, RouteLocationRaw} from "vue-router";
import {RouteAuthAccessError, RouteAvailabilityError} from "@/shared/lib/errors";
import {safeReturnTo} from "@/shared/lib/return-to";
import {useProfileStore, useSettingsStore} from "@/shared/stores";
import {RouteName, EventTypes} from "@/shared/types";
import {pullSyncedSettings} from "../lib/settings-sync";
import { type TRouterMiddleware} from "./types";


// Where a page that needs sign-in sends the person: the login page, which
// brings them back to that page afterwards (#6772: shared event links).
export const loginRoute = (to: Pick<RouteLocationNormalized, 'fullPath'>): RouteLocationRaw => {
  const returnTo = safeReturnTo(to.fullPath)

  return returnTo
    ? { name: RouteName.Login, query: { return_to: returnTo } }
    : { name: RouteName.Login }
}

export const auth: TRouterMiddleware = async ({ to, next }) => {
  const settingsStore  = useSettingsStore()
  const {isFetched, isAuthEnabled }  = storeToRefs(settingsStore)

  if (!isFetched.value) {
    await settingsStore.fetchSettings()
  }

  if (!isAuthEnabled.value) {
    if (to.name === RouteName.Login) {
      next({ name: RouteName.Home })
    }
    return
  }

  const profileStore = useProfileStore()
  const { isAuthenticated}  = storeToRefs(profileStore)

  await profileStore.getStoredToken()

  if (isAuthenticated.value) {
    try {
      await profileStore.getProfile();
    } catch (_) {
      throw new RouteAuthAccessError(`Access denied`, to.path)
    }
  }

  // The person's saved preferences, once per sign-in, before the page shows.
  if (isAuthenticated.value) {
    await pullSyncedSettings(profileStore.token)
  }

  if (to.name !== RouteName.Login && !isAuthenticated.value) {
    throw new RouteAuthAccessError(`Access denied`, to.path)
  }

  if (to.name === RouteName.Login && to?.query?.token) {
    profileStore.setToken(String(to.query.token))
  }

  return;
}

// Pages that exist only with sign-in on (the audit log): home otherwise.
export const requireAuthOn: TRouterMiddleware = async () => {
  const settingsStore = useSettingsStore()

  if (!settingsStore.isFetched) {
    await settingsStore.fetchSettings()
  }

  return settingsStore.isAuthEnabled ? undefined : { name: RouteName.Home }
}

export const checkType: TRouterMiddleware = async ({ to, next }) => {
  const pageType = to.params.type

  if (!pageType) {
    next({ name: to.name })

    return
  }

  if (Array.isArray(pageType)) {
    throw new RouteAvailabilityError('Invalid Path parameter', to.path)
  }

  if (
    !Object.values(RouteName).includes(pageType as RouteName)
    && !Object.values(EventTypes).includes(pageType as EventTypes)
  ) {
    throw new RouteAvailabilityError('Invalid Path', to.path)
  }

  return;
}

