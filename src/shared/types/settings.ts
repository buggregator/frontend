import {type EventType} from "./events";

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
    events: EventType[],
  },
  // Server's check for a newer release; null when the check is off, absent on
  // older servers. latest, url and checked_at come with the first good check.
  update?: TUpdateCheck | null,
}

export type TUpdateCheck = {
  current: string,
  latest?: string,
  url?: string,
  available: boolean,
  checked_at?: string,
}


export type TProjects = {
  data: {
    name: string,
    key: string,
    is_default: boolean,
  }[]
}

export type FilePathMapping = {
  source_path: string,
  target_path: string,
}
