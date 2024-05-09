<script lang="ts" setup>
import { computed } from "vue";
import type { Ref } from "vue";
import type {
  InspectorSegment,
  InspectorTransaction,
  Inspector,
} from "~/src/entities/inspector/types";

type Props = {
  payload: Inspector;
};

const props = defineProps<Props>();

const segmentColor = (color: string): string => {
  switch (color) {
    case "sqlite":
      return "orange";
    case "view":
      return "blue";
    case "artisan":
      return "purple";
    default:
      return "gray";
  }
};

const transaction: Ref<InspectorTransaction> = computed(
  () => props.payload[0] as InspectorTransaction
);

const grid = computed(() => {
  let { duration } = transaction.value;

  const totalCells = 5;
  const width = duration / totalCells + 1;
  const widthPercent = (100 / (totalCells + 1)).toFixed(2);

  const segments = [duration];
  for (let i = 0; i < totalCells; i += 1) {
    const d = Math.abs((duration -= width));
    segments.push(Math.floor(d));
  }

  return {
    segments: segments.reverse(),
    width,
    widthPercent,
  };
});

interface InspectorItemType {
  segment: InspectorSegment;
  transaction: InspectorTransaction;
}

const segments: Ref<InspectorSegment[]> = computed(() =>
  (props.payload as Array<InspectorSegment | InspectorTransaction>)
    .filter(
      (
        <T extends keyof InspectorItemType>(type: T) =>
        (
          action: InspectorItemType[keyof InspectorItemType]
        ): action is InspectorItemType[T] =>
          action.model === type
      )("segment")
    )
    .filter(
      (segment: InspectorSegment) =>
        transaction.value.hash === segment?.transaction?.hash
    )
);

const segmentTypes = computed(() =>
  [...new Set(segments.value.map((data) => data.type))].map((type) => ({
    color: segmentColor(type),
    type,
  }))
);

const series = computed(() => {
  const { duration } = transaction.value;

  return segments.value.map((segment: InspectorSegment) => {
    const widthPercent = Math.max(
      Number(((segment.duration * 100) / duration).toFixed(2)),
      0.5
    );

    const marginPercent = (((segment.start || 0) * 100) / duration).toFixed();

    return {
      widthPercent,
      marginPercent,
      segment,
      color: segmentColor(segment.type),
    };
  });
});

// TODO: add hover on time line rows with details
</script>

<template>
  <section class="inspector-page-timeline">
    <h3 class="inspector-page-timeline__title">Timeline</h3>

    <div
      v-if="segmentTypes.length > 0"
      class="inspector-page-timeline__segment-types"
    >
      <div
        v-for="type in segmentTypes"
        :key="type.type"
        class="inspector-page-timeline__segment-type"
      >
        <div
          :class="type.color"
          class="inspector-page-timeline__segment-type__color-box"
        ></div>
        <span class="inspector-page-timeline__segment-type__label">
          {{ type.type }}
        </span>
      </div>
    </div>

    <div v-if="series.length > 0" class="inspector-page-timeline__segments">
      <div class="inspector-page-timeline__segments-cells">
        <div
          v-for="segment in grid.segments"
          :key="segment"
          class="inspector-page-timeline__segments-cell"
        >
          {{ segment }} ms
        </div>
      </div>

      <div
        class="inspector-page-timeline__series"
        :style="{ 'background-size': `${grid.widthPercent}% 20%` }"
      >
        <div
          v-for="row in series"
          :key="`${row.segment.label} - ${row.segment.duration}`"
          class="inspector-page-timeline__series-segment"
        >
          <div class="inspector-page-timeline__series-segment-label">
            {{ row.segment.label }} - {{ row.segment.duration }} ms
          </div>
          <div class="flex items-center w-full">
            <div
              :style="{ width: row.marginPercent + '%' }"
              class="inspector-page-timeline__series-segment-start"
            >
              <span class="inspector-page-timeline__series-segment-start-label"
                >{{ row.segment.start }} ms</span
              >
            </div>
            <div
              class="inspector-page-timeline__series-segment-time"
              :class="[row.color]"
              :style="{ width: row.widthPercent + '%' }"
            ></div>
            <div class="inspector-page-timeline__series-segment-end"></div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="series.length === 0"
      class="inspector-page-timeline__no-segments"
    >
      <h3 class="inspector-page-timeline__no-segments-placeholder">No data</h3>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@import "src/assets/mixins";

.inspector-page-timeline {
  @apply py-5;
}

.inspector-page-timeline__title {
  @include text-muted;
  @apply font-bold uppercase text-sm mb-5;
}

.inspector-page-timeline__segment-types {
  @apply flex space-x-7 mb-4;
}

.inspector-page-timeline__segment-type {
  @apply flex items-center;
}

.inspector-page-timeline__segment-type__color-box {
  @apply w-4 h-4 rounded mr-2;
}

.inspector-page-timeline__segments {
  @apply overflow-x-scroll border border-gray-50 dark:border-gray-600;
}

.inspector-page-timeline__segments-cells {
  @apply grid grid-cols-6 divide-x divide-gray-50 dark:divide-gray-600 border-b border-gray-50 dark:border-gray-600 font-bold text-center text-2xs sm:text-xs md:text-sm;
}

.inspector-page-timeline__segments-cell {
  @apply py-2 pl-3;
}

.inspector-page-timeline__series {
  background-image: linear-gradient(to right, #dedede 1px, transparent 1px);
}

.dark .inspector-page-timeline__series {
  background-image: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.04) 1px,
    transparent 1px
  );
}

.inspector-page-timeline__series-segment {
  @apply mt-4 text-right;
}

.inspector-page-timeline__series-segment-label {
  @apply text-2xs md:text-xs font-bold whitespace-nowrap pr-2 pb-1;
}

.inspector-page-timeline__series-segment-start {
  @apply flex items-center justify-end;
}

.inspector-page-timeline__series-segment-end,
.inspector-page-timeline__series-segment-start {
  background-color: rgba(177 177 177 / 17%);
}

.dark .inspector-page-timeline__series-segment-end,
.dark .inspector-page-timeline__series-segment-start {
  background-color: rgba(255, 255, 255, 0.04);
}

.inspector-page-timeline__series-segment-end {
  @apply flex-1;
}

.inspector-page-timeline__series-segment-start-label {
  @apply text-2xs font-bold dark:text-gray-200 mr-3;
}

.inspector-page-timeline__series-segment-time {
  @apply flex-none;
  min-width: 0;
}

.inspector-page-timeline__series-segment-start,
.inspector-page-timeline__series-segment-time,
.inspector-page-timeline__series-segment-end {
  @apply h-4 md:h-5 lg:h-6;
}

.inspector-page-timeline__no-segments {
  @apply flex w-full flex-col items-center mt-5;
}

.inspector-page-timeline__no-segments-placeholder {
  @apply text-lg md:text-xl lg:text-3xl mt-5 font-bold text-gray-300;
}

.inspector-page-timeline__series-segment-time,
.inspector-page-timeline__segment-type__color-box {
  @apply bg-gray-600;
}

.inspector-page-timeline__series-segment-time.orange,
.inspector-page-timeline__segment-type__color-box.orange {
  @apply bg-orange-600;
}

.inspector-page-timeline__series-segment-time.blue,
.inspector-page-timeline__segment-type__color-box.blue {
  @apply bg-blue-600;
}

.inspector-page-timeline__series-segment-time.purple,
.inspector-page-timeline__segment-type__color-box.purple {
  @apply bg-purple-600;
}

.inspector-page-timeline__segment-type__label {
  @apply text-xs font-bold;
}
</style>
