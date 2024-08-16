import { storeToRefs } from "pinia";
import {useProfileStore} from "../../stores/profile/profile-store";
import type { TProjects} from "../../types";
import { REST_API_URL } from "../io/constants";


type TUseSettings = {
  api: {
    getProjects: () => Promise<TProjects>
  }
}

export const useSettings = (): TUseSettings => {
  const { token } = storeToRefs(useProfileStore())

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
      getProjects,
    }
  }
}
