<script lang="ts" setup>
import { useTitle } from '@vueuse/core'
import { onMounted, ref } from 'vue'
import { RouteName } from '@/shared/types'
import { IconSvg } from '@/shared/ui'

useTitle('404 | Buggregator')

const ready = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    ready.value = true
  })
})
</script>

<template>
  <div class="nf">
    <!-- Background -->
    <div
      class="nf__bg"
      aria-hidden="true"
    >
      <div class="nf__orb nf__orb--1" />
      <div class="nf__orb nf__orb--2" />
      <div class="nf__orb nf__orb--3" />
      <div class="nf__grid" />
    </div>

    <div class="nf__content">
      <!-- Giant 404 behind -->
      <div
        class="nf__giant"
        :class="{ 'is-visible': ready }"
        aria-hidden="true"
      >
        404
      </div>

      <!-- Main text overlay -->
      <div class="nf__body">
        <h1
          class="nf__headline"
          :class="{ 'is-visible': ready }"
        >
          Oops.<br>
          <span class="nf__headline-accent">We haven't built</span><br>
          this page yet.
        </h1>

        <p
          class="nf__sub"
          :class="{ 'is-visible': ready }"
        >
          Maybe it's a bug. Maybe it's a feature we haven't invented.
        </p>

        <RouterLink
          :to="{ name: RouteName.Home }"
          class="nf__btn"
          :class="{ 'is-visible': ready }"
        >
          <span class="nf__btn-inner">
            <svg
              class="nf__btn-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Back to home
          </span>
        </RouterLink>
      </div>
    </div>

    <!-- Bottom branding -->
    <div
      class="nf__bottom"
      :class="{ 'is-visible': ready }"
    >
      <IconSvg
        class="nf__bottom-logo"
        name="logo-short"
      />
      <span>buggregator</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nf {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background: #07070b;
  overflow: hidden;
}

/* ── Background ───────────────────────────────────────────── */
.nf__bg {
  position: absolute;
  inset: 0;
}

.nf__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.3;
  will-change: transform;
}

.nf__orb--1 {
  width: 500px;
  height: 500px;
  top: -15%;
  left: -10%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, transparent 70%);
  animation: orbDrift1 14s ease-in-out infinite;
}

.nf__orb--2 {
  width: 450px;
  height: 450px;
  bottom: -10%;
  right: -10%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%);
  animation: orbDrift2 17s ease-in-out infinite;
}

.nf__orb--3 {
  width: 300px;
  height: 300px;
  top: 50%;
  right: 30%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%);
  animation: orbDrift3 20s ease-in-out infinite;
}

.nf__grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 100%);
}

@keyframes orbDrift1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(25px, 15px) scale(1.05);
  }
  66% {
    transform: translate(-15px, -10px) scale(0.95);
  }
}

@keyframes orbDrift2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-20px, -15px) scale(1.06);
  }
  66% {
    transform: translate(18px, 20px) scale(0.94);
  }
}

@keyframes orbDrift3 {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-25px, -20px);
  }
}

/* ── Content ──────────────────────────────────────────────── */
.nf__content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

/* ── Giant 404 ────────────────────────────────────────────── */
.nf__giant {
  font-family: 'DM Sans', sans-serif;
  font-weight: 900;
  font-size: clamp(12rem, 25vw, 22rem);
  line-height: 0.85;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.06);
  user-select: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateY(20px);
  opacity: 0;
  transition:
    opacity 0.8s ease,
    transform 0.8s ease;
  transition-delay: 0s;

  &.is-visible {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }
}

/* ── Body text ────────────────────────────────────────────── */
.nf__body {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nf__headline {
  font-family: 'DM Sans', sans-serif;
  font-weight: 700;
  font-size: clamp(2rem, 4.5vw, 3.5rem);
  line-height: 1.1;
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

.nf__headline-accent {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nf__sub {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 24px;
  max-width: 400px;
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
  transition-delay: 0.45s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── Button ───────────────────────────────────────────────── */
.nf__btn {
  margin-top: 40px;
  padding: 1.5px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6);
  background-size: 300% 300%;
  animation: btnGlow 4s ease-in-out infinite;
  text-decoration: none;
  transition:
    transform 200ms ease,
    box-shadow 300ms ease;
  box-shadow: 0 0 20px -6px rgba(59, 130, 246, 0.25);
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity 0.5s ease,
    transform 0.5s ease,
    box-shadow 0.3s ease;
  transition-delay: 0.6s;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    box-shadow: 0 0 32px -4px rgba(59, 130, 246, 0.4);
  }
}

.nf__btn-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 28px;
  border-radius: 10.5px;
  background: rgba(0, 0, 0, 0.85);
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #fff;
  transition: background 200ms ease;

  .nf__btn:hover & {
    background: rgba(0, 0, 0, 0.7);
  }
}

.nf__btn-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
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

/* ── Bottom ───────────────────────────────────────────────── */
.nf__bottom {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.15);
  opacity: 0;
  transition: opacity 0.5s ease;
  transition-delay: 0.8s;

  &.is-visible {
    opacity: 1;
  }
}

.nf__bottom-logo {
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.2);
}

/* ── Reduced motion ───────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .nf__orb,
  .nf__btn {
    animation: none;
  }

  .nf__giant,
  .nf__headline,
  .nf__sub,
  .nf__btn,
  .nf__bottom {
    opacity: 1;
    transform: translate(-50%, -50%);
    transition: none;
  }

  .nf__headline,
  .nf__sub,
  .nf__btn {
    transform: none;
  }

  .nf__bottom {
    transform: translateX(-50%);
  }
}
</style>
