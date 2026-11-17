<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import { useDialogFocus } from '@/shared/lib/use-dialog-focus'
import { IconSvg } from '@/shared/ui'
import SetupGuide from './setup-guide.vue'
import content from './setup-help.json'

// The drawer behind the header's «How to set up» (#5941): the guide without
// its hero. Esc, the scrim and × close it; focus returns to the button.
type Props = {
  sectionId: string
  sectionTitle: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const docs = (content.sections as { id: string; docs: string }[]).find(
  (s) => s.id === props.sectionId
)?.docs
const headingId = `setup-panel-${props.sectionId}`

const root = ref<HTMLElement | null>(null)
const guide = ref<InstanceType<typeof SetupGuide> | null>(null)
useDialogFocus(root, () => emit('close'))
// After the focus helper: the selected stack tab, not the docs link.
onMounted(() => nextTick(() => guide.value?.focusTabs()))
</script>

<template>
  <Teleport to="body">
    <div
      class="setup-panel__scrim"
      data-test="setup-panel-scrim"
      @click="emit('close')"
    />
    <div
      ref="root"
      class="setup-panel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="headingId"
      data-test="setup-panel"
    >
      <div class="setup-panel__head">
        <h2
          :id="headingId"
          class="setup-panel__title"
        >
          How to set up {{ sectionTitle }}
        </h2>
        <a
          v-if="docs"
          class="setup-panel__docs"
          :href="docs"
          target="_blank"
          rel="noopener noreferrer"
        >{{ sectionTitle }} docs ↗<span class="sr-only"> (opens in a new tab)</span></a>
        <button
          type="button"
          class="setup-panel__close"
          aria-label="Close"
          @click="emit('close')"
        >
          <IconSvg
            name="times"
            class="setup-panel__close-icon"
          />
        </button>
      </div>
      <div class="setup-panel__body">
        <SetupGuide
          ref="guide"
          :section-id="sectionId"
          :section-title="sectionTitle"
          variant="panel"
        />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.setup-panel__scrim {
  @apply fixed inset-0 z-[60] bg-gray-900/45 dark:bg-gray-950/60;
  animation: setup-fade 0.2s ease-out;
}

.setup-panel {
  @apply fixed top-0 right-0 bottom-0 z-[61] flex flex-col;
  @apply bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700;
  width: min(560px, 100vw);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  animation: setup-slide 0.2s ease-out;

  :global(.dark) & {
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
}

.setup-panel__head {
  @apply flex items-center gap-3 h-14 flex-none px-6 border-b border-gray-200 dark:border-gray-700;

  @media (max-width: 639px) {
    @apply px-4 gap-2;
  }
}

.setup-panel__title {
  @apply m-0 flex-1 min-w-0 truncate text-base font-semibold text-gray-900 dark:text-gray-100;
}

.setup-panel__docs {
  @apply text-[13px] font-medium whitespace-nowrap;
  @apply text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200;

  @media (max-width: 639px) {
    @apply inline-flex items-center min-h-[44px];
  }
}

.setup-panel__close {
  @apply flex items-center justify-center w-8 h-8 rounded flex-shrink-0;
  @apply text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700;

  @media (max-width: 639px) {
    @apply w-11 h-11;
  }
}

.setup-panel__close-icon {
  @apply w-4 h-4;
}

.setup-panel__body {
  @apply flex-1 overflow-y-auto;
}

a,
button {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400;
}

@keyframes setup-slide {
  from {
    transform: translateX(24px);
    opacity: 0.6;
  }
}

@keyframes setup-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .setup-panel,
  .setup-panel__scrim {
    animation: none;
  }
}
</style>
