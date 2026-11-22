<script lang="ts" setup>
import { APP_HEADER_TOOLBAR_ID, hasHeaderToolbar } from './toolbar'

// Its content goes to row 2 of the page header when the page has one
// (provideHeaderToolbar); otherwise (a story, a test, a page without row 2)
// it stays in place.
const active = hasHeaderToolbar()
</script>

<template>
  <Teleport
    defer
    :to="`#${APP_HEADER_TOOLBAR_ID}`"
    :disabled="!active"
  >
    <slot />
  </Teleport>
</template>
