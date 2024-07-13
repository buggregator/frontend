import {useProfileStore} from "../../stores/profile";
import type { TProfile, TSettings } from "../../types";
import { REST_API_URL } from "../io";


type TUseSettings = {
  api: {
    getProfile: () => Promise<TProfile>
    getSettings: () => Promise<TSettings>
  }
}

export const useSettings = (): TUseSettings => {
  const { token } = storeToRefs(useProfileStore())

  const getAppSettings = () => fetch(`${REST_API_URL}/api/settings`)
    .then((response) => response.json())
    .catch((e) => {
      console.error(e);

      return null
    });

  const getProfile = () => fetch(`${REST_API_URL}/api/me`, {
    headers: {"X-Auth-Token": token.value || ""}
  })
    .then((response) => response.json())
    .catch((e) => {
      console.error(e);

      return null
    });

  return {
    api: {
      getProfile,
      getSettings: getAppSettings
    }
  }
}
