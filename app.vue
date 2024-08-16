<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
import "./src/assets/index.css";
import "./src/assets/vendor";
import { useEventsStore } from "~/src/shared/stores";

useEventsStore().initialize();
</script>
