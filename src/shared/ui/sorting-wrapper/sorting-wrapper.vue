<script lang="ts" setup>
import { SORTING_ORDER } from './constants'

type Props = {
  sort: SORTING_ORDER
}

type Emits = {
  changeSort: [value: SORTING_ORDER]
}

const props = withDefaults(defineProps<Props>(), {
  sort: SORTING_ORDER.DEFAULT
})

const emit = defineEmits<Emits>()

const changeSortOrder = () => {
  const sortOrderList = [SORTING_ORDER.ASC, SORTING_ORDER.DESC, SORTING_ORDER.DEFAULT]

  const nextSortOrderIndex = sortOrderList.findIndex((sortOrder) => sortOrder === props.sort)

  const nextSortOrder = sortOrderList[nextSortOrderIndex + 1] || sortOrderList[0]

  emit('changeSort', nextSortOrder)
}
</script>

<template>
  <span class="sorting-wrapper" @click="changeSortOrder">
    <slot />

    <span class="sorting-wrapper__markers">
      <span
        class="sorting-wrapper__marker sorting-wrapper__marker--asc"
        :class="{
          'sorting-wrapper__marker--active': sort === SORTING_ORDER.ASC
        }"
      />
      <span
        class="sorting-wrapper__marker sorting-wrapper__marker--desc"
        :class="{
          'sorting-wrapper__marker--active': sort === SORTING_ORDER.DESC
        }"
      />
    </span>
  </span>
</template>

<style lang="scss" scoped>
.sorting-wrapper {
  @apply cursor-pointer relative bg-transparent inline-flex items-center;
}

.sorting-wrapper__markers {
  @apply flex items-center h-full flex-col text-gray-400 dark:text-gray-600 gap-y-1 ml-1;
}

.sorting-wrapper__marker {
  @apply opacity-40 hover:opacity-100 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-gray-500 border-r-[4px] border-r-transparent border-b-[6px] border-b-transparent;
}

.sorting-wrapper__marker--asc {
  @apply border-b-[6px] border-b-gray-600 dark:border-b-white border-t-[0px];
}

.sorting-wrapper__marker--desc {
  @apply border-t-[6px] border-t-gray-600 dark:border-t-white border-b-[0px];
}

.sorting-wrapper__marker--active {
  @apply opacity-100;
}
</style>
