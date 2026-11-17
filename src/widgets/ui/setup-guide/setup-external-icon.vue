<template>
  <!-- «Opens elsewhere»: an icon, not «↗», which some systems draw as a colour emoji. -->
  <svg
    class="setup-external-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
</template>

<style lang="scss" scoped>
.setup-external-icon {
  @apply inline-block w-3 h-3 ml-0.5 align-[-1px];
}
</style>
