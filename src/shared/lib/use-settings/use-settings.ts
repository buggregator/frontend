import { storeToRefs } from "pinia";
import {useProfileStore} from "../../stores/profile/profile-store";
import type {TProfile, TSettings, TProjects} from "../../types";
import { REST_API_URL } from "../io/constants";


type TUseSettings = {
  api: {
    getProfile: () => Promise<TProfile>
    getSettings: () => Promise<TSettings>
    getProjects: () => Promise<TProjects>
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
  const getProjects = () => fetch(`${REST_API_URL}/api/projects`, {
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
      getProjects,
      getSettings: getAppSettings
    }
  }
}
