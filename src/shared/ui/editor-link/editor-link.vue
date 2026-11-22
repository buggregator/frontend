<script lang="ts" setup>
// A link that opens a file in the person's code editor (vscode://, phpstorm://…).
// It never opens a new tab: the browser hands the URL to the editor and stays
// on the page. With target="_blank" Firefox leaves an empty tab behind
// (frontend#289). The click does not reach the card or row around the link.
defineProps<{
  href: string
}>()
</script>

<template>
  <a
    :href="href"
    @click.stop
  ><slot /></a>
</template>
