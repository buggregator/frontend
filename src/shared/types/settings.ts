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
}


export type TProjects = {
  data: {
    name: string,
    key: string,
    is_default: boolean,
  }[]
}
