<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { RouteName } from '@/shared/types/app'
import { LayoutBase } from '@/widgets/ui'
import { useProfileStore, useSettingsStore } from '@/shared/stores'
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
      <IconSvg class="login-page__logo" name="logo" />
      <div class="login-page__form">
        <div class="login-page__form-left-block">
          <h1 class="login-page__form-title">Welcome Back</h1>
          <p class="login-page__form-text">Let's get you signed in.</p>
          <button class="login-page__form-button" @click="redirect">
            <IconSvg class="w-6" name="lock" fill="currentcolor" />
            Continue to SSO
          </button>
        </div>
        <div class="login-page__form-right-block" />
      </div>
    </div>
  </LayoutBase>
</template>

<style lang="scss" scoped>
@import 'src/assets/mixins';

.login-page {
  @apply bg-gray-800;
  @apply h-screen w-screen;
}

.login-page__container {
  @apply flex flex-col items-center justify-center flex-1;
  @apply px-4 sm:px-0;
  @apply h-full;
}

.login-page__form {
  @apply flex w-full sm:w-3/4 md:w-2/3 xl:w-1/2 h-96;
  @apply shadow-2xl;
  @apply bg-gray-200;
  @apply rounded-2xl;
  @apply mt-10;
}

.login-page__form-left-block {
  @apply flex flex-col flex-1 justify-center items-center;
  @apply mb-8 p-12;
  @apply w-1/2;
}

.login-page__form-right-block {
  @apply w-0 md:w-1/2 h-full rounded-r-2xl;

  background: url('/src/assets/static/bg.jpg');
  background-size: cover;
  background-position: center center;
}

.login-page__logo {
  @apply w-48 text-gray-200;
}

.login-page__form-title {
  @apply text-4xl text-center font-thin text-black;
  @apply my-10;
}

.login-page__form-text {
  @apply pb-2 text-center text-sm text-gray-800;
}

.login-page__form-button {
  @apply bg-blue-500 hover:bg-blue-600 transition-colors;
  @apply text-white rounded;
  @apply px-4 py-2 gap-2;
  @apply inline-flex;
}
</style>
