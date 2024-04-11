import { useSettings } from "~/src/shared/lib/use-settings";

// todo: use store for token
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
        appSettings: settings,
        authToken: {token: null}
      }
    }
  }

  return {
    provide: {
      appSettings: settings,
      authToken: {token: null}
    }
  }
})
