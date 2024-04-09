<script setup lang="ts">
import { useNuxtApp, navigateTo } from "#app"
import { REST_API_URL } from "~/src/shared/lib/io";
import { IconSvg } from "~/src/shared/ui";

definePageMeta({
  layout: 'blank'
})

const app = useNuxtApp()

const redirect = async () => {
  await navigateTo(`${REST_API_URL}/${app.$appSettings.auth.login_url}`, {
    external: true
  })
}
</script>

<template>
  <div class="login-page">
    <div class="login-form-container">
      <IconSvg class="login-form--logo" name="logo"/>
      <div class="login-form">
        <div class="login-form-left-block">
          <h1 class="login-form--title">Welcome Back</h1>
          <p class="pb-2 text-center text-sm text-gray-800">Let's get you signed in.</p>
          <button class="login-form--button" @click="redirect">
            <IconSvg class="w-6" name="lock" fill="currentcolor"/>
            Continue to SSO
          </button>
        </div>
        <div class="login-form-right-block"
             style="background: url('/bg.jpg'); background-size: cover; background-position: center center;">
        </div>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
@import "assets/mixins";

.login-page {
  @apply bg-gray-800;
  @apply h-screen w-screen;
}

.login-form-container {
  @apply flex flex-col items-center justify-center flex-1;
  @apply px-4 sm:px-0;
  @apply h-full;
}

.login-form {
  @apply flex w-full sm:w-3/4 md:w-2/3 xl:w-1/2 h-96;
  @apply shadow-2xl;
  @apply bg-gray-200;
  @apply rounded-2xl;
  @apply mt-10;
}

.login-form-left-block {
  @apply flex flex-col flex-1 justify-center items-center;
  @apply mb-8 p-12;
  @apply w-1/2;
}

.login-form-right-block {
  @apply w-0 md:w-1/2 h-full rounded-r-2xl;
}

.login-form--logo {
  @apply w-48 text-gray-200;
}

.login-form--title {
  @apply text-4xl text-center font-thin;
  @apply my-10;
}

.login-form--button {
  @apply bg-blue-500 hover:bg-blue-600 transition-colors;
  @apply text-white rounded;
  @apply px-4 py-2 gap-2;
  @apply inline-flex;
}
</style>
