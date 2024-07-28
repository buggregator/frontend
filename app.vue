<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
import "./src/assets/index.css";
import "./src/assets/vendor";
import { useEventsStore, useSettingsStore } from "~/src/shared/stores";

useSettingsStore().initialize();
useEventsStore().initialize();
</script>
