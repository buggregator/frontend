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

  if (codeEditor.value == 'vscode') {
    return `vscode://file/${fileName}${line ? `:${line}` : ''}`
  }

  return `${codeEditor.value}://open?file=${fileName}${line ? `&line=${line}` : ''}`
})

const isEditorLink = (key: string) => !!editorLink.value && (key === 'file' || key === 'line')
</script>

<template>
  <div class="pc-footer">
    <div class="pc-footer__meta">
      <template v-if="mappedOrigins">
        <template
          v-for="(value, key) in mappedOrigins"
          :key="key"
        >
          <a
            v-if="isEditorLink(String(key))"
            :href="editorLink"
            target="_blank"
            class="pc-footer__tag pc-footer__tag--link"
          >
            <span class="pc-footer__tag-key">{{ key }}</span>
            <span class="pc-footer__tag-value">{{ value }}</span>
          </a>

          <span
            v-else
            class="pc-footer__tag"
          >
            <span class="pc-footer__tag-key">{{ key }}</span>
            <span class="pc-footer__tag-value">{{ value }}</span>
          </span>
        </template>
      </template>
    </div>

    <div
      v-if="serverName"
      class="pc-footer__host"
    >
      <IconSvg
        name="host"
        class="pc-footer__host-icon"
      />
      <span class="pc-footer__host-name">{{ serverName }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pc-footer {
  @apply flex items-center justify-between flex-wrap gap-2;
}

.pc-footer__meta {
  @apply flex flex-wrap items-center gap-1;
}

.pc-footer__tag {
  @apply inline-flex items-center gap-1 px-1.5 py-0.5 rounded;
  @apply text-2xs;
  @apply bg-gray-100 dark:bg-gray-600/30;
  @apply transition-colors;
}

.pc-footer__tag--link {
  @apply hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer;
}

.pc-footer__tag-key {
  @apply text-gray-400 dark:text-gray-500;
}

.pc-footer__tag-value {
  @apply font-mono text-gray-600 dark:text-gray-300;
}

.pc-footer__host {
  @apply inline-flex items-center gap-1 text-gray-400 dark:text-gray-500;
}

.pc-footer__host-icon {
  @apply w-3 h-3;
}

.pc-footer__host-name {
  @apply font-mono text-2xs;
}
</style>
