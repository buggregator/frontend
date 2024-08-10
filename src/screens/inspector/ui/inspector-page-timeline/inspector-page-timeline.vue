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
          action: InspectorItemType[keyof InspectorItemType],
        ): action is InspectorItemType[T] =>
          action.model === type
      )("segment"),
    )
    .filter(
      (segment: InspectorSegment) =>
        transaction.value.hash === segment?.transaction?.hash,
    ),
);

const segmentTypes = computed(() =>
  [...new Set(segments.value.map((data) => data.type))].map((type) => ({
    color: segmentColor(type),
    type,
  })),
);

const series = computed(() => {
  const { duration } = transaction.value;

  return segments.value.map((segment: InspectorSegment) => {
    const widthPercent = Math.max(
      Number(((segment.duration * 100) / duration).toFixed(2)),
      0.5,
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
    <div class="inspector-page-timeline__head">
      <h3 class="inspector-page-timeline__head-title">Timeline</h3>

      <div
        v-if="segmentTypes.length > 0"
        class="inspector-page-timeline__head-tips"
      >
        <div
          v-for="type in segmentTypes"
          :key="type.type"
          class="inspector-page-timeline__head-tip"
        >
          <div
            :style="{ background: type.color }"
            class="inspector-page-timeline__head-tip-box"
          ></div>

          <span class="inspector-page-timeline__head-tip-label">
            {{ type.type }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="series.length > 0" class="inspector-page-timeline__body">
      <div class="inspector-page-timeline__body-cells">
        <div
          v-for="segment in grid.segments"
          :key="segment"
          class="inspector-page-timeline__body-cell"
        >
          {{ segment }} ms
        </div>
      </div>

      <div
        class="inspector-page-timeline__segments"
        :style="{ 'background-size': `${grid.widthPercent}% 20%` }"
      >
        <div
          v-for="row in series"
          :key="`${row.segment.label} - ${row.segment.duration}`"
          class="inspector-page-timeline__segment"
        >
          <div class="inspector-page-timeline__segment-label">
            {{ row.segment.label }} - {{ row.segment.duration }} ms
          </div>

          <div class="inspector-page-timeline__segment-view">
            <div
              :style="{ width: row.marginPercent + '%' }"
              class="inspector-page-timeline__segment-start"
            >
              <span class="inspector-page-timeline__segment-start-label">
                {{ row.segment.start }} ms
              </span>
            </div>

            <div
              class="inspector-page-timeline__segment-time"
              :style="{ width: row.widthPercent + '%', background: row.color }"
            ></div>

            <div class="inspector-page-timeline__segment-end"></div>
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
  @apply overflow-x-scroll border border-gray-50 dark:border-gray-600;
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
  @apply mt-4 text-right;
}

.inspector-page-timeline__segment-label {
  @apply text-2xs md:text-xs font-bold whitespace-nowrap pr-2 pb-1;
}

.inspector-page-timeline__segment-view {
  @apply flex items-center w-full;

  background: repeating-linear-gradient(
    -45deg,
    rgba(177 177 177 / 10%),
    rgba(177 177 177 / 10%) 20px,
    rgba(177 177 177 / 17%) 20px,
    rgba(177 177 177 / 17%) 40px
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
  @apply flex-none;
  @apply h-4 md:h-5 lg:h-6 rounded-sm;
  min-width: 0;
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
