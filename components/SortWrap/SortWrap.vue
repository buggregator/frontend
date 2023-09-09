<template>
  <span class="sort-wrap" @click="changeSortOrder">
    <slot />

    <span class="sort-wrap__markers">
      <span
        class="sort-wrap__marker sort-wrap__marker--asc"
        :class="{ 'sort-wrap__marker--active': sort === sortOrder.ASC }"
      ></span>
      <span
        class="sort-wrap__marker sort-wrap__marker--desc"
        :class="{ 'sort-wrap__marker--active': sort === sortOrder.DESC }"
      ></span>
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { SORT_ORDER } from "~/config/constants";

export default defineComponent({
  components: {},
  props: {
    sort: {
      type: String,
      default: SORT_ORDER.DEFAULT,
    },
  },
  emits: ["changeSort"],
  computed: {
    sortOrder() {
      return SORT_ORDER;
    },
  },
  methods: {
    changeSortOrder() {
      const sortOrderList = [
        SORT_ORDER.ASC,
        SORT_ORDER.DESC,
        SORT_ORDER.DEFAULT,
      ];

      const nextSortOrderIndex = sortOrderList.findIndex(
        (sortOrder) => sortOrder === this.sort
      );

      const nextSortOrder =
        sortOrderList[nextSortOrderIndex + 1] || sortOrderList[0];

      this.$emit("changeSort", nextSortOrder);
    },
  },
});
</script>

<style lang="scss" scoped>
.sort-wrap {
  @apply cursor-pointer relative bg-transparent inline-flex items-center;
}

.sort-wrap__markers {
  @apply flex items-center h-full flex-col text-gray-400 dark:text-gray-600 gap-y-1 ml-1;
}

.sort-wrap__marker {
  @apply opacity-40 hover:opacity-100 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-gray-500 border-r-[4px] border-r-transparent border-b-[6px] border-b-transparent;
}

.sort-wrap__marker--asc {
  @apply border-b-[6px] border-b-gray-600 dark:border-b-white border-t-[0px];
}

.sort-wrap__marker--desc {
  @apply border-t-[6px] border-t-gray-600 dark:border-t-white border-b-[0px];
}

.sort-wrap__marker--active {
  @apply opacity-100;
}
</style>
