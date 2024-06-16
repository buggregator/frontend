import { useSettings } from "~/src/shared/lib/use-settings";

// todo: use store for token
export default defineNuxtPlugin(async () => {
  const {
    api,
  } = useSettings();

  let settings = {
    auth: {
      enabled: false,
      login_url: '/login',
    },
    version: '0.0.0',
  }

  try {
    settings = await api.getSettings() as { auth: { enabled: boolean; login_url: string }; version: string };
  } catch (e) {
    console.error('Server is not available!')
  }

  if (!settings?.auth?.enabled) {
    return {
      provide: {
        appSettings: settings,
        authToken: {token: ''}
      }
    }
  }

  return {
    provide: {
      appSettings: settings,
      authToken: {token: ''}
    }
  }
})
