import { REST_API_URL } from "../io";


type TUseSettings = {
  api: {
    getVersion: () => Promise<string>
  }
}

export const useSettings = (): TUseSettings => {
  const getAppVersion = () => fetch(`${REST_API_URL}/api/version`)
    .then((response) => response.json())
    .then((response) => response?.version || 'unknown')
    .catch(() => 'unknown');

  return {
    api: {
      getVersion: getAppVersion,
    }
  }
}
