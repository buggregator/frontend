<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { withDefaults, defineProps, computed } from 'vue'
import { useSettingsStore } from '../../stores/settings'
import { IconSvg } from '../icon-svg'

// TODO: Move this to a shared file
const KEY_MAP: { [key: string]: string } = {
  php_version: 'php',
  laravel_version: 'laravel',
  symfony_version: 'symfony',
  line_number: 'line',
  hostname: 'host',
  environment: 'env'
}

type Props = {
  serverName: string
  originConfig: {
    [key: string]: string
  } | null
}

const props = withDefaults(defineProps<Props>(), {
  serverName: '',
  originConfig: null
})

const { codeEditor } = storeToRefs(useSettingsStore())

const mappedOrigins = computed(() =>
  Object.entries(props.originConfig || {}).reduce(
    (acc, [key, value]) => {
      const fileName = props.originConfig?.file || ''

      if (key === 'name' && fileName.includes(value, fileName.length - value.length)) {
        return acc
      }

      if (!value || value === 'undefined') {
        return acc
      }

      const mappedKey = KEY_MAP[key] || key
      acc[mappedKey] = value

      return acc
    },
    {} as { [key: string]: string }
  )
)

const editorLink = computed(() => {
  if (!props.originConfig) {
    return ''
  }

  const fileName = mappedOrigins.value.file || ''
  const line = mappedOrigins.value.line || ''

  if (!fileName || fileName === 'unknown') {
    return ''
  }

  return `${codeEditor.value}://open?file=${fileName}${line ? `&line=${line}` : ''}`
})

const isEditorLink = (key: string) => !!editorLink.value && (key === 'file' || key === 'line')
</script>

<template>
  <div class="preview-card-footer">
    <div class="preview-card-footer__tags">
      <template v-if="mappedOrigins">
        <template
          v-for="(value, key) in mappedOrigins"
          :key="key"
        >
          <div
            v-if="!isEditorLink(String(key))"
            class="preview-card-footer__tag"
          >
            <span class="preview-card-footer__tag-key">{{ key }}:</span>
            <span class="preview-card-footer__tag-value">{{ value }}</span>
          </div>

          <a
            v-if="isEditorLink(String(key))"
            :href="editorLink"
            target="_blank"
            class="preview-card-footer__tag"
          >
            <span class="preview-card-footer__tag-key">{{ key }}:</span>
            <span class="preview-card-footer__tag-value">{{ value }}</span>
          </a>
        </template>
      </template>
    </div>

    <div
      v-if="serverName"
      class="preview-card-footer__host"
    >
      <IconSvg
        name="host"
        class="preview-card-footer__host-icon"
      />
      <span class="preview-card-footer__host-name">
        {{ serverName }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-card-footer__tags {
  @apply flex flex-wrap items-center gap-1;
}

.preview-card-footer__tag {
  @apply hover:bg-gray-200 hover:dark:bg-gray-700 text-2xs lg:text-xs px-2 py-1 border border-gray-600 rounded flex flex-wrap gap-1 leading-none cursor-pointer;
}

.preview-card-footer__tag-key {
  @apply text-gray-500 dark:text-gray-300 font-bold;
}

.preview-card-footer__tag-value {
  @apply text-gray-700 dark:text-gray-100 font-bold;
}

.preview-card-footer__host {
  @apply inline-flex items-center justify-start gap-1 py-1 text-gray-600 dark:text-gray-300;
}

.preview-card-footer__host-icon {
  @apply w-3 h-3 lg:w-4 lg:h-4;
}

.preview-card-footer__host-name {
  @apply flex-initial font-bold text-2xs lg:text-xs;
}
</style>
