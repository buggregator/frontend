import { EVENT_TYPES } from "./events";

export type TProfile =  {
  username: string,
  email: string,
  avatar: string,
}

export type TSettings = {
  auth: {
    enabled: boolean,
    login_url: string,
  },
  version: string,
  client: {
    events: EVENT_TYPES[],
  }
}


export type TProjects = {
  data: {
    name: string,
    key: string,
    is_default: boolean,
  }[]
}
