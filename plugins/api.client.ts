import { REST_API_URL } from "~/utils/events-transport";

export default defineNuxtPlugin(() => {
  const getAppVersion = () => fetch(`${REST_API_URL}/api/version`)
    .then((response) => response.json())
    .then((response) => {
      if (response?.data) {
        return response.data
      }

      return 'unknown'
    })
    .catch(() => 'unknown');

  return {
    provide: {
      api: {
        getVersion: getAppVersion,
      }
    }
  }
})
