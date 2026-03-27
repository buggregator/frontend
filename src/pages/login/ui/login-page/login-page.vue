<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { LayoutBase } from '@/widgets/ui'
import { useProfileStore, useSettingsStore } from '@/shared/stores'
import { RouteName } from '@/shared/types'
import { IconSvg } from '@/shared/ui'

useTitle('Login | Buggregator')

const store = useProfileStore()
const { loginLinkUrl } = storeToRefs(useSettingsStore())
const router = useRouter()

if (store.isAuthenticated) {
  router.replace({ name: RouteName.Home })
}

const redirect = () => {
  router.replace({ path: loginLinkUrl.value })
}
</script>

<template>
  <LayoutBase class="login-page">
    <div class="login-page__container">
      <div class="login-page__card">
        <IconSvg
          class="login-page__logo"
          name="logo"
        />

        <h1 class="login-page__title">
          Welcome Back
        </h1>

        <p class="login-page__text">
          Sign in to continue to Buggregator
        </p>

        <button
          class="login-page__button"
          @click="redirect"
        >
          <IconSvg
            class="login-page__button-icon"
            name="lock"
            fill="currentcolor"
          />
          Continue with SSO
        </button>
      </div>

      <p class="login-page__footer">
        Powered by Buggregator
      </p>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
.login-page {
  @apply bg-gray-100 dark:bg-gray-900;
  @apply h-screen w-screen;
}

.login-page__container {
  @apply flex flex-col items-center justify-center flex-1;
  @apply px-4;
  @apply h-full;
}

.login-page__card {
  @apply flex flex-col items-center;
  @apply w-full max-w-sm;
  @apply bg-white dark:bg-gray-800;
  @apply border border-gray-200 dark:border-gray-700;
  @apply rounded-xl shadow-lg;
  @apply p-8 md:p-10;
}

.login-page__logo {
  @apply w-36 mb-8;
  @apply text-gray-800 dark:text-gray-100;
}

.login-page__title {
  @apply text-2xl font-semibold text-center;
  @apply text-gray-800 dark:text-gray-100;
  @apply mb-2;
}

.login-page__text {
  @apply text-sm text-center;
  @apply text-gray-500 dark:text-gray-400;
  @apply mb-8;
}

.login-page__button {
  @apply w-full;
  @apply bg-blue-500 hover:bg-blue-600;
  @apply text-white font-medium text-sm;
  @apply rounded-lg px-4 py-2.5;
  @apply inline-flex items-center justify-center gap-2;
  @apply transition-colors;
}

.login-page__button-icon {
  @apply w-4 h-4;
}

.login-page__footer {
  @apply mt-8 text-xs text-gray-400 dark:text-gray-600;
}
</style>
