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
    title: string,
    key: string
  }[]
}
