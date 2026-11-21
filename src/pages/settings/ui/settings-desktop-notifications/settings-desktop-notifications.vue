<script lang="ts" setup>
import { useEventListener } from '@vueuse/core'
import { SETTINGS_ITEMS } from '@/shared/constants'
import { useDesktopNotify } from '@/shared/lib/desktop-notify'
import { useDesktopNotificationsSetting } from '../../lib/use-desktop-notifications-setting'
import { SettingsRow } from '../settings-row'
import { SettingsSwitch } from '../settings-switch'

const { state, isAsking, toggle, refresh, showTest } = useDesktopNotificationsSetting(useDesktopNotify())

// The person may allow or block the site in another tab or the address bar.
useEventListener(window, 'focus', refresh)
</script>

<template>
  <SettingsRow
    :item="SETTINGS_ITEMS.desktopNotifications"
  >
    <template #default="{ labelId, hintId }">
      <SettingsSwitch
        :checked="state === 'on'"
        :disabled="state === 'unsupported' || isAsking"
        :aria-labelledby="labelId"
        :aria-describedby="`${hintId} desktop-notify-status`"
        data-test="desktop-notify-switch"
        @toggle="toggle"
      />
    </template>

    <template #extra>
      <p
        id="desktop-notify-status"
        class="desktop-notify__status"
        :class="`desktop-notify__status--${state}`"
        aria-live="polite"
        data-test="desktop-notify-status"
      >
        <template v-if="state === 'unsupported'">
          Not available on this address: browsers show notifications only on localhost and https.
          Open Buggregator at http://localhost:8000 (or behind https) to use them.
        </template>
        <template v-else-if="state === 'blocked'">
          Blocked by the browser. Allow notifications for this site (the icon left of the address),
          then turn this on.
        </template>
        <template v-else-if="isAsking">
          Answer the browser's question to turn notifications on.
        </template>
        <template v-else-if="state === 'on'">
          On: new errors show while this tab is in the background.
          <button
            type="button"
            class="desktop-notify__test"
            data-test="desktop-notify-test"
            @click="showTest"
          >
            Send a test
          </button>
        </template>
        <template v-else>
          Off. The browser asks for permission when you turn it on.
        </template>
      </p>
    </template>
  </SettingsRow>
</template>

<style lang="scss" scoped>
.desktop-notify__status {
  @apply text-xs mt-2 text-gray-600 dark:text-gray-300;
}

.desktop-notify__status--blocked,
.desktop-notify__status--unsupported {
  @apply text-amber-700 dark:text-amber-300;
}

.desktop-notify__test {
  @apply ml-1 underline underline-offset-2;
  @apply text-blue-700 dark:text-blue-300;
  @apply hover:text-blue-900 dark:hover:text-blue-100;
}
</style>
