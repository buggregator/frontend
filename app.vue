<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
import "./src/assets/index.css";
import "./src/assets/vendor";
import { useSettingsStore } from "~/src/shared/stores";

useSettingsStore().initialize();
</script>
