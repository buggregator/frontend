<template>
  <div
    ref="rootEl"
    class="relative"
  >
    <div
      :id="listboxId"
      class="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      role="listbox"
      :aria-labelledby="labelledBy"
    >
      <button
        v-for="(opt, index) in options"
        :key="String(opt.value)"
        :ref="(el) => setOptionRef(el, index)"
        type="button"
        class="flex w-full items-center px-4 py-2 text-left text-base text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:hover:bg-gray-700"
        role="option"
        :aria-selected="opt.value === modelValue"
        :disabled="!!opt.disabled"
        :class="{
          'rounded-t-xl': isFirstOption(opt),
          'rounded-b-xl': isLastOption(opt)
        }"
        @click="selectOption(opt.value)"
      >
        <span>{{ opt.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type ComponentPublicInstance } from 'vue'

type DropdownOption = {
  value: string
  text: string
  disabled?: boolean
}

const props = defineProps<{
  modelValue: string
  options: DropdownOption[]
  labelledBy?: string
  listboxId: string
  ignoreElements?: Array<HTMLElement | null>
}>()

const emit = defineEmits<{
  (e: 'select', value: string): void
  (e: 'close'): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const optionEls = ref<Array<HTMLElement | null>>([])

const selectOption = (value: string) => {
  emit('select', value)
  emit('close')
}

const setOptionRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  const node = el && '$el' in el ? (el as ComponentPublicInstance).$el : el
  optionEls.value[index] = node as HTMLElement | null
}

const isFirstOption = (opt: DropdownOption) => {
  return props.options[0]?.value === opt.value
}

const isLastOption = (opt: DropdownOption) => {
  return props.options[props.options.length - 1]?.value === opt.value
}

const getNextEnabledIndex = (start: number, direction: 1 | -1) => {
  const total = props.options.length
  let idx = start
  for (let i = 0; i < total; i += 1) {
    idx = (idx + direction + total) % total
    if (!props.options[idx]?.disabled) return idx
  }
  return -1
}

const focusOptionAt = (index: number) => {
  const el = optionEls.value[index]
  if (el) {
    el.focus()
  }
}

const focusFirstEnabled = () => {
  const idx = props.options.findIndex((opt) => !opt.disabled)
  if (idx >= 0) {
    focusOptionAt(idx)
  }
}

const focusLastEnabled = () => {
  for (let i = props.options.length - 1; i >= 0; i -= 1) {
    if (!props.options[i]?.disabled) {
      focusOptionAt(i)
      break
    }
  }
}

const onNavigate = (direction: 1 | -1) => {
  const activeIndex = optionEls.value.findIndex((el) => el === document.activeElement)
  if (activeIndex === -1) {
    if (direction === 1) focusFirstEnabled()
    else focusLastEnabled()
    return
  }
  const nextIndex = getNextEnabledIndex(activeIndex, direction)
  if (nextIndex >= 0) {
    focusOptionAt(nextIndex)
  }
}

const isIgnoredTarget = (target: Node) => {
  return (props.ignoreElements || []).some((el) => el?.contains(target))
}

const onClickOutside = (e: PointerEvent) => {
  const target = e.target as Node | null
  if (!rootEl.value || !target) return
  if (!rootEl.value.contains(target) && !isIgnoredTarget(target)) {
    emit('close')
  }
}

const onKeydown = (e: KeyboardEvent) => {
  const openKeys = ['Enter', ' ', 'Space', 'Spacebar']
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    onNavigate(1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    onNavigate(-1)
    return
  }

  if (openKeys.includes(e.key)) {
    const activeIndex = optionEls.value.findIndex((el) => el === document.activeElement)
    if (activeIndex === -1) return
    const opt = props.options[activeIndex]
    if (opt?.disabled) return
    e.preventDefault()
    selectOption(opt.value)
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>
