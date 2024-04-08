import { useSettings } from "~/src/shared/lib/use-settings";

const {localStorage} = window;

export default defineNuxtPlugin(async () => {
  const {
    api: {getSettings},
  } = useSettings();

  let settings = {
    auth: {
      enabled: false,
      login_url: '/login',
    },
    version: '0.0.0',
  }

  try {
    settings = await getSettings()
  } catch (e) {
    console.error('Server is not available!')
  }

  if (!settings.auth.enabled) {
    return {
      provide: {
        authToken: {token: null},
        appSettings: settings
      }
    }
  }

  const token: string | null = localStorage?.getItem('token')

  return {
    provide: {
      authToken: {token},
      appSettings: settings
    }
  }
})
