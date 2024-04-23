import { REST_API_URL } from "../io";


type TUseSettings = {
  api: {
    getVersion: () => Promise<string>
  }
}

export const useSettings = (): TUseSettings => {
  const nuxtApp = useNuxtApp()

  // todo: we can get version from settings
  const getAppVersion = () => fetch(`${REST_API_URL}/api/version`)
    .then((response) => response.json())
    .then((response) => response?.version || 'unknown')
    .catch(() => 'unknown');

  const getAppSettings = () => fetch(`${REST_API_URL}/api/settings`)
    .then((response) => response.json())
    .catch(() => 'unknown');

  const getProfile = () => fetch(`${REST_API_URL}/api/me`, {
    headers: {"X-Auth-Token": nuxtApp.$authToken.token}
  })
    .then((response) => response.json())
    .catch(() => 'unknown');

  return {
    api: {
      getVersion: getAppVersion,
      getProfile,
      getSettings: getAppSettings
    }
  }
}
