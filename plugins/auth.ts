import {useSettingsStore} from "~/src/shared/stores";

// todo: use store for token
export default defineNuxtPlugin( () => {
  const { auth}  = storeToRefs(useSettingsStore())

  if (!auth?.value.isEnabled) {
    return {
      provide: {
        authToken: {token: ''}
      }
    }
  }

  return {
    provide: {
      authToken: {token: ''}
    }
  }
})
