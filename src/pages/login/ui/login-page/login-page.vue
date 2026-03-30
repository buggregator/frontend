<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
  window.location.href = loginLinkUrl.value
}

const ready = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    ready.value = true
  })
})
</script>

<template>
  <div class="login-page">
    <!-- Left panel — fun bug character -->
    <div class="login-hero">
      <!-- Animated background -->
      <div
        class="login-hero__bg"
        aria-hidden="true"
      >
        <div class="login-hero__orb login-hero__orb--1" />
        <div class="login-hero__orb login-hero__orb--2" />
        <div class="login-hero__orb login-hero__orb--3" />
        <div class="login-hero__grid" />
      </div>

      <div class="login-hero__content">
        <h2
          class="login-hero__headline"
          :class="{ 'is-visible': ready }"
        >
          Your bugs<br>
          <span class="login-hero__headline-accent">are not</span><br>
          a mystery anymore.
        </h2>

        <p
          class="login-hero__tagline"
          :class="{ 'is-visible': ready }"
        >
          Well, most of them.
        </p>

        <p
          class="login-hero__cta"
          :class="{ 'is-visible': ready }"
        >
          Let's catch them with buggregator &rarr;
        </p>
      </div>

      <!-- Bottom branding -->
      <div
        class="login-hero__bottom"
        :class="{ 'is-visible': ready }"
      >
        <IconSvg
          class="login-hero__bottom-logo"
          name="logo-short"
        />
        <a
          href="https://buggregator.dev"
          target="_blank"
          rel="noopener"
          class="login-hero__bottom-link"
        >buggregator.dev</a>
      </div>
    </div>

    <!-- Right panel — auth form -->
    <div class="login-form">
      <div class="login-form__inner">
        <div
          class="login-form__card"
          :class="{ 'is-visible': ready }"
        >
          <IconSvg
            class="login-form__logo"
            name="logo"
          />

          <h1 class="login-form__title">
            Welcome back
          </h1>

          <p class="login-form__subtitle">
            Sign in to continue to your dashboard
          </p>

          <button
            class="login-form__sso-btn"
            @click="redirect"
          >
            <span class="login-form__sso-btn-content">
              <IconSvg
                class="login-form__sso-btn-icon"
                name="lock"
                fill="currentcolor"
              />
              Continue with SSO
            </span>
          </button>

          <div class="login-form__divider">
            <span>Secure authentication</span>
          </div>

          <p class="login-form__hint">
            You will be redirected to your identity provider to complete the sign-in process.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ── Page layout ──────────────────────────────────────────── */
.login-page {
  @apply flex min-h-screen w-screen;
}

/* ── Left hero panel ──────────────────────────────────────── */
.login-hero {
  @apply hidden lg:flex relative flex-col justify-between;
  @apply w-1/2 xl:w-[55%] p-12 xl:p-16;
  background: #0a0a0f;
  overflow: hidden;
}

.login-hero__bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.login-hero__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
  will-change: transform;
}

.login-hero__orb--1 {
  width: 500px;
  height: 500px;
  top: -10%;
  right: -10%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 70%);
  animation: orbDrift1 12s ease-in-out infinite;
}

.login-hero__orb--2 {
  width: 400px;
  height: 400px;
  bottom: -5%;
  left: -5%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%);
  animation: orbDrift2 15s ease-in-out infinite;
}

.login-hero__orb--3 {
  width: 300px;
  height: 300px;
  top: 40%;
  left: 30%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%);
  animation: orbDrift3 18s ease-in-out infinite;
}

.login-hero__grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%);
}

@keyframes orbDrift1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-30px, 20px) scale(1.05);
  }
  66% {
    transform: translate(20px, -15px) scale(0.95);
  }
}

@keyframes orbDrift2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(25px, -20px) scale(1.08);
  }
  66% {
    transform: translate(-15px, 25px) scale(0.92);
  }
}

@keyframes orbDrift3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-20px, -30px) scale(1.1);
  }
}

/* ── Hero content ─────────────────────────────────────────── */
.login-hero__content {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 520px;
}

.login-hero__headline {
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: 3.5rem;
  line-height: 1.08;
  letter-spacing: -0.035em;
  color: #fff;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
  transition-delay: 0.2s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-hero__headline-accent {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-hero__tagline {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 24px;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
  transition-delay: 0.5s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-hero__cta {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 48px;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
  transition-delay: 0.7s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Hero bottom ──────────────────────────────────────────── */
.login-hero__bottom {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.2);
  opacity: 0;
  transition: opacity 0.5s ease;
  transition-delay: 0.7s;

  &.is-visible {
    opacity: 1;
  }
}

.login-hero__bottom-logo {
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.25);
}

.login-hero__bottom-link {
  color: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  transition: color 150ms ease;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
}

/* ── Right form panel ─────────────────────────────────────── */
.login-form {
  @apply flex-1 flex items-center justify-center;
  @apply bg-white dark:bg-gray-900;
  @apply px-6 py-12 sm:px-12;
}

.login-form__inner {
  @apply w-full max-w-sm flex flex-col items-center;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-form__card {
  @apply w-full flex flex-col items-center;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
  transition-delay: 0.15s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form__logo {
  @apply w-40 mb-10;
  @apply text-gray-800 dark:text-gray-100;
}

.login-form__title {
  @apply text-2xl font-semibold text-center;
  @apply text-gray-900 dark:text-gray-50;
  @apply mb-2;
  letter-spacing: -0.02em;
}

.login-form__subtitle {
  @apply text-sm text-center;
  @apply text-gray-500 dark:text-gray-400;
  @apply mb-10;
}

/* ── SSO Button with gradient border ─────────────────────── */
.login-form__sso-btn {
  @apply relative w-full;
  padding: 2px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6);
  background-size: 300% 300%;
  animation: btnGlow 4s ease-in-out infinite;
  cursor: pointer;
  border: none;
  transition:
    transform 200ms ease,
    box-shadow 300ms ease;
  box-shadow: 0 0 20px -6px rgba(59, 130, 246, 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 0 32px -4px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-form__sso-btn-content {
  @apply flex items-center justify-center gap-2.5;
  @apply font-medium text-sm;
  padding: 12px 24px;
  border-radius: 10px;
  background: white;
  color: #1e293b;
  transition: background 200ms ease;

  :global(.dark) & {
    background: #111827;
    color: #f1f5f9;
  }

  .login-form__sso-btn:hover & {
    background: #f8fafc;

    :global(.dark) & {
      background: #1a2332;
    }
  }
}

.login-form__sso-btn-icon {
  @apply w-4 h-4;
  color: #3b82f6;
}

@keyframes btnGlow {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* ── Divider ──────────────────────────────────────────────── */
.login-form__divider {
  @apply w-full flex items-center gap-3 my-6;

  &::before,
  &::after {
    content: '';
    @apply flex-1 h-px bg-gray-200 dark:bg-gray-700;
  }

  span {
    @apply text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap;
  }
}

/* ── Hint ─────────────────────────────────────────────────── */
.login-form__hint {
  @apply text-xs text-center leading-relaxed;
  @apply text-gray-400 dark:text-gray-500;
  max-width: 280px;
}

/* ── Reduced motion ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .login-hero__orb,
  .login-form__sso-btn {
    animation: none;
  }

  .login-form__sso-btn:hover {
    transform: none;
  }

  .login-hero__headline,
  .login-hero__tagline,
  .login-hero__cta,
  .login-hero__bottom,
  .login-form__card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ── Mobile: single column ────────────────────────────────── */
@media (max-width: 1023px) {
  .login-page {
    @apply bg-white dark:bg-gray-900;
  }

  .login-form {
    @apply min-h-screen;
  }
}
</style>
