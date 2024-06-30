import { useNuxtApp } from "#app"; // eslint-disable-line @conarti/feature-sliced/layers-slices
import type { TProfile, TSettings } from "../../types";
import { REST_API_URL } from "../io";


type TUseSettings = {
  api: {
    getVersion: () => Promise<string>
    getProfile: () => Promise<TProfile>
    getSettings: () => Promise<TSettings>
  }
}

export const useSettings = (): TUseSettings => {
  const nuxtApp = useNuxtApp()

  // todo: we can get version from settings
  const getAppVersion = () => fetch(`${REST_API_URL}/api/version`)
    .then((response) => response.json())
    .then((response) => response?.version || 'unknown')
    .catch((e) => {
      console.error(e);

      return null
    });

  const getAppSettings = () => fetch(`${REST_API_URL}/api/settings`)
    .then((response) => response.json())
    .catch((e) => {
      console.error(e);

      return null
    });

  const getProfile = () => fetch(`${REST_API_URL}/api/me`, {
    headers: {"X-Auth-Token": nuxtApp.$authToken.token || ""}
  })
    .then((response) => response.json())
    .catch((e) => {
      console.error(e);

      return null
    });

  return {
    api: {
      getVersion: getAppVersion,
      getProfile,
      getSettings: getAppSettings
    }
  }
}
