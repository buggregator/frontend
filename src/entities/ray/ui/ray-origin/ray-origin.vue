<script lang="ts" setup>
import { computed } from "vue"
import type { Ref } from "vue"
import type { RayFrame, RayPayloadOrigin } from "../../types"
import { RayFile } from "../ray-file"

type Props = {
  origin: RayPayloadOrigin
}

const props = defineProps<Props>()

const originFile: Ref<RayFrame> = computed(
  () =>
    ({
      file_name: props.origin.file,
      line_number: props.origin.line_number,
      class_name: "",
      function_name: ""
    }) as unknown as RayFrame
)
</script>

<template>
  <div class="ray-origin">
    <RayFile :file="originFile" />
  </div>
</template>

<style lang="scss" scoped>
.ray-origin {
  display: block;
}
</style>
