import { REST_API_URL } from "~/utils/io";

export default defineNuxtPlugin(() => {
  const getAppVersion = () => fetch(`${REST_API_URL}/api/version`)
    .then((response) => response.json())
    .then((response) => response?.version || 'unknown')
    .catch(() => 'unknown');

  return {
    provide: {
      api: {
        getVersion: getAppVersion,
      }
    }
  }
})
