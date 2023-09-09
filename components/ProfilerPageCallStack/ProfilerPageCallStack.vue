<template>
  <div class="profiler-page-callstack">
    <header class="profiler-page-callstack__header">
      <div class="profiler-page-callstack__header-cpu">
        <SortWrap :sort="sortCPU" @changeSort="changeCPUOrder"> CPU </SortWrap>
        /
        <SortWrap :sort="sortMemory" @changeSort="changeMemoryOrder">
          Memory
        </SortWrap>
      </div>

      <div class="profiler-page-callstack__header-calls">
        <SortWrap :sort="sortCalls" @changeSort="changeCallsOrder">
          Calls
        </SortWrap>
      </div>
    </header>

    <div class="profiler-page-callstack__calls">
      <ProfilerPageCallStackRow
        v-for="(edge, key) in sortedEdges"
        :key="key"
        :edge="edge"
        @hover="$emit('hover', $event)"
        @hide="$emit('hide')"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Profiler } from "~/config/types";
import ProfilerPageCallStackRow from "~/components/ProfilerPageCallStackRow/ProfilerPageCallStackRow.vue";
import SortWrap from "~/components/SortWrap/SortWrap.vue";
import { SORT_ORDER } from "~/config/constants";

export default defineComponent({
  components: {
    ProfilerPageCallStackRow,
    SortWrap,
  },
  props: {
    event: {
      type: Object as PropType<Profiler>,
      required: true,
    },
  },
  emits: ["hover", "hide"],
  data() {
    return {
      sortCPU: SORT_ORDER.ASC,
      sortMemory: SORT_ORDER.DEFAULT,
      sortCalls: SORT_ORDER.DEFAULT,
    };
  },
  computed: {
    sortedEdges() {
      const sortEdgesEntries = ([, a], [, b]) => {
        if (this.sortCPU === SORT_ORDER.ASC) {
          return b.cost.p_cpu - a.cost.p_cpu;
        }
        if (this.sortCPU === SORT_ORDER.DESC) {
          return a.cost.p_cpu - b.cost.p_cpu;
        }
        if (this.sortMemory === SORT_ORDER.ASC) {
          return b.cost.p_mu - a.cost.p_mu;
        }
        if (this.sortMemory === SORT_ORDER.DESC) {
          return a.cost.p_mu - b.cost.p_mu;
        }
        if (this.sortCalls === SORT_ORDER.ASC) {
          return b.cost.ct - a.cost.ct;
        }
        if (this.sortCalls === SORT_ORDER.DESC) {
          return a.cost.ct - b.cost.ct;
        }

        return 0;
      };

      return Object.entries(this.event.edges)
        .sort(sortEdgesEntries)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
    },
  },
  methods: {
    changeCPUOrder(sortValue: SORT_ORDER) {
      this.sortCPU = sortValue;
      this.sortMemory = SORT_ORDER.DEFAULT;
      this.sortCalls = SORT_ORDER.DEFAULT;
    },
    changeMemoryOrder(sortValue: SORT_ORDER) {
      this.sortCPU = SORT_ORDER.DEFAULT;
      this.sortMemory = sortValue;
      this.sortCalls = SORT_ORDER.DEFAULT;
    },
    changeCallsOrder(sortValue: SORT_ORDER) {
      this.sortCPU = SORT_ORDER.DEFAULT;
      this.sortMemory = SORT_ORDER.DEFAULT;
      this.sortCalls = sortValue;
    },
  },
});
</script>

<style lang="scss" scoped>
.profiler-page-callstack {
}

.profiler-page-callstack__header {
  @apply flex items-stretch bg-gray-400 dark:bg-gray-600 text-xs dark:text-white text-gray-800 text-center font-bold uppercase py-2;
}

.profiler-page-callstack__header-cpu {
  @apply flex-1 dark:text-white text-gray-800;
}

.profiler-page-callstack__header-calls {
  @apply w-16;
}

.profiler-page-callstack__calls {
  @apply flex flex-col divide-y divide-gray-200 dark:divide-gray-600;
}
</style>
