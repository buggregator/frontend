<script lang="ts" setup>
import { computed, type ComputedRef, type Ref } from "vue";
import type {
  InspectorSegment,
  InspectorTransaction,
  Inspector,
} from "~/src/entities/inspector/types";

type Props = {
  payload: Inspector;
};

const COLUMNS_NUMBER = 5;

const props = defineProps<Props>();

const segmentColor = (color: string): string => {
  switch (color) {
    case "sqlite":
      return "#f97316";
    case "view":
      return "#3b82f6";
    case "artisan":
      return "#a855f7";
    case "pgsql":
      return "#22c55e";
    default:
      return "#64748b";
  }
};

const transaction: Ref<InspectorTransaction> = computed(
  () => props.payload[0] as InspectorTransaction,
);

const layoutCells = computed(() => {
  const maxWidth = transaction.value.duration;
  const cellWidth = Math.floor(maxWidth / COLUMNS_NUMBER + 1);

  return new Array(COLUMNS_NUMBER).fill(null).reduceRight((acc, _, i) => {
    acc.push(Math.abs(Math.floor(maxWidth - cellWidth * (i + 1))));

    if (!i) {
      // NOTE: add last cell as full size without rounding
      acc.push(maxWidth);
    }

    return acc;
  }, []);
});

const segments: ComputedRef<InspectorSegment[]> = computed(() =>
  props.payload
    .filter((item): item is InspectorSegment => item.model === "segment")
    .filter((el) => el?.transaction?.hash === transaction.value.hash),
);

const segmentTypes = computed(() => {
  const arr: string[] = [];

  segments.value.forEach((data) => {
    if (!arr.includes(data.type)) {
      arr.push(data.type);
    }
  });

  return arr;
});

const segmentRows = computed(() => {
  const { duration } = transaction.value;

  return segments.value.map((segment: InspectorSegment) => ({
    label: segment.label,
    duration: segment.duration,
    start: segment.start,
    type: segment.type,
    widthPercent: Math.max(
      Number(((segment.duration * 100) / duration).toFixed(2)),
      0.5,
    ),
    marginPercent: (((segment.start || 0) * 100) / duration).toFixed(),
  }));
});
</script>

<template>
  <section class="inspector-page-timeline">
    <div class="inspector-page-timeline__head">
      <h3 class="inspector-page-timeline__head-title">Timeline</h3>

      <div
        v-if="segmentTypes.length > 0"
        class="inspector-page-timeline__head-tips"
      >
        <div
          v-for="segmentType in segmentTypes"
          :key="segmentType"
          class="inspector-page-timeline__head-tip"
        >
          <div
            :style="{ background: segmentColor(segmentType) }"
            class="inspector-page-timeline__head-tip-box"
          ></div>

          <span class="inspector-page-timeline__head-tip-label">
            {{ segmentType }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="segmentRows.length > 0" class="inspector-page-timeline__body">
      <div
        class="inspector-page-timeline__body-cells"
        :class="`grid-cols-${COLUMNS_NUMBER + 1}`"
      >
        <div
          v-for="cell in layoutCells"
          :key="cell"
          class="inspector-page-timeline__body-cell"
        >
          {{ cell }} ms
        </div>
      </div>

      <div
        class="inspector-page-timeline__segments"
        :style="{
          'background-size': `${(100 / COLUMNS_NUMBER).toFixed(2)}% 20%`,
        }"
      >
        <div
          v-for="segmentRow in segmentRows"
          :key="`${segmentRow.label} - ${segmentRow.duration}`"
          class="inspector-page-timeline__segment"
        >
          <div class="inspector-page-timeline__segment-label">
            {{ segmentRow.label }} - {{ segmentRow.duration }} ms
          </div>

          <div class="inspector-page-timeline__segment-view">
            <div
              :style="{ width: segmentRow.marginPercent + '%' }"
              class="inspector-page-timeline__segment-start"
            >
              <span class="inspector-page-timeline__segment-start-label">
                {{ segmentRow.start }} ms
              </span>
            </div>

            <div
              class="inspector-page-timeline__segment-time"
              :style="{
                width: segmentRow.widthPercent + '%',
                background: segmentColor(segmentRow.type),
              }"
            >
              <div class="inspector-page-timeline__segment-tooltip">
                Duration: {{ segmentRow.duration }} ms<br />
                Start: {{ segmentRow.start }} ms<br />
                Type: {{ segmentRow.type }}<br />
                Label:
                <div>{{ segmentRow.label }}</div>
              </div>
            </div>

            <div class="inspector-page-timeline__segment-end"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="segmentRows.length === 0"
      class="inspector-page-timeline__no-segments"
    >
      <h3 class="inspector-page-timeline__no-segments-placeholder">No data</h3>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.inspector-page-timeline {
  @apply py-5 relative;
}

.inspector-page-timeline__head-title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.inspector-page-timeline__head-tips {
  @apply flex space-x-7 mb-4;
}

.inspector-page-timeline__head-tip {
  @apply flex items-center;
}

.inspector-page-timeline__head-tip-box {
  @apply w-4 h-4 rounded mr-2;
}

.inspector-page-timeline__head-tip-label {
  @apply text-xs font-bold;
}

.inspector-page-timeline__body {
  @apply border border-gray-50 dark:border-gray-600;
}

.inspector-page-timeline__body-cells {
  @apply grid grid-cols-6 divide-x border-b;
  @apply font-bold text-center text-2xs sm:text-xs md:text-sm;
  @apply divide-gray-50 dark:divide-gray-600 border-gray-50 dark:border-gray-600;
}

.inspector-page-timeline__body-cell {
  @apply py-2 px-3;
}

.inspector-page-timeline__segments {
  background-image: linear-gradient(to right, #dedede 1px, transparent 1px);

  .dark & {
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.04) 1px,
      transparent 1px
    );
  }
}

.inspector-page-timeline__segment {
  @apply mt-2 text-right cursor-pointer;
}

.inspector-page-timeline__segment-label {
  @apply text-2xs md:text-xs font-bold whitespace-nowrap pr-2 pb-1 opacity-10;

  .inspector-page-timeline__segment:hover & {
    @apply opacity-100;
  }
}

.inspector-page-timeline__segment-view {
  @apply flex items-center w-full;

  background: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.08),
    rgba(0, 0, 0, 0.08) 20px,
    rgba(0, 0, 0, 0.06) 20px,
    rgba(0, 0, 0, 0.06) 40px
  );

  .dark & {
    background: repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.05),
      rgba(255, 255, 255, 0.05) 20px,
      rgba(255, 255, 255, 0.04) 20px,
      rgba(255, 255, 255, 0.04) 40px
    );
  }
}

.inspector-page-timeline__segment-start {
  @apply flex items-center justify-end;
  @apply h-4 md:h-5 lg:h-6;
}

.inspector-page-timeline__segment-time {
  @apply flex-none relative;
  @apply h-4 md:h-5 lg:h-6 rounded-sm;
  min-width: 0;
}

.inspector-page-timeline__segment-tooltip {
  @apply absolute z-10 h-auto -translate-x-[50%] -translate-y-[110%];
  @apply bg-gray-600 hidden left-1/2 p-2 rounded-sm text-xs text-white min-w-[200px] start-0 text-left;

  .inspector-page-timeline__segment:hover & {
    @apply block;
  }
}

.inspector-page-timeline__segment-end {
  @apply flex-1;
  @apply h-4 md:h-5 lg:h-6;
}

.inspector-page-timeline__segment-start-label {
  @apply text-2xs font-bold dark:text-gray-200 mr-3;
}

.inspector-page-timeline__no-segments {
  @apply flex w-full flex-col items-center mt-5;
}

.inspector-page-timeline__no-segments-placeholder {
  @apply text-lg md:text-xl lg:text-3xl mt-5 font-bold text-gray-300;
}
</style>
