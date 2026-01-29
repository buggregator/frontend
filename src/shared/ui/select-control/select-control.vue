<template>
  <div
    ref="rootEl"
    class="inline-flex flex-col"
    @focusout="onFocusOut"
  >
    <div class="relative w-56">
      <input
        v-if="name"
        type="hidden"
        :name="name"
        :value="modelValue"
      >

      <button
        :id="selectId"
        ref="triggerEl"
        type="button"
        class="w-56 rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-left text-lg font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        :disabled="disabled"
        :aria-expanded="isOpen"
        :aria-controls="listboxId"
        @pointerdown="onTriggerPointerDown"
        @keydown="onTriggerKeydown"
      >
        <span>{{ selectedOption?.text ?? '' }}</span>
      </button>

      <DropdownMenu
        v-if="isOpen"
        :listbox-id="listboxId"
        :labelled-by="selectId"
        :model-value="modelValue"
        :options="options"
        :ignore-elements="[triggerEl]"
        @select="selectOption"
        @close="close"
      />

      <!-- chevron -->
      <svg
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform duration-200 ease-out dark:text-gray-500"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DropdownMenu from '../dropdown-menu/dropdown-menu.vue'

type SelectOption = {
  value: string
  text: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string
  options: SelectOption[]
  disabled?: boolean
  name?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const selectId = `sel_${Math.random().toString(36).slice(2, 9)}`
const listboxId = `${selectId}_list`

const rootEl = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const triggerEl = ref<HTMLElement | null>(null)

const selectedOption = computed(
  () => props.options.find((opt) => opt.value === props.modelValue) || props.options[0]
)

const close = () => {
  isOpen.value = false
}

const open = () => {
  if (!props.disabled) {
    isOpen.value = true
  }
}

const toggle = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

const onTriggerPointerDown = (e: PointerEvent) => {
  if (e.button !== 0) return
  toggle()
}

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  close()
}

const onTriggerKeydown = (e: KeyboardEvent) => {
  if (props.disabled) return

  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }

  const openKeys = ['Enter', ' ', 'Space', 'Spacebar', 'ArrowDown']
  if (openKeys.includes(e.key)) {
    e.preventDefault()
    if (isOpen.value) return
    open()
  }
}

const onFocusOut = () => {
  requestAnimationFrame(() => {
    const active = document.activeElement
    if (rootEl.value && active && rootEl.value.contains(active)) return
    close()
  })
}
</script>
