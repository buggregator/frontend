import type { Meta, StoryObj } from '@storybook/vue3';
import { useRay } from '../../lib';
import {
  rayCallerMock,
  rayCarbonMock,
  rayColorMock,
  rayCounterMock,
  rayDumpMock,
  rayExceptionMock,
  rayEmptyStringMock,
  rayHideMock,
  rayImageMock,
  rayIntegerMock,
  rayJsonMock,
  rayLabelMock,
  rayMeasureStartMock,
  rayNotifyMock,
  raySizeMock,
  rayTableMock,
  rayTextMock,
  rayTraceMock,
  rayLockMock,
  rayBooleanTrueMock,
  rayBooleanFalseMock,
} from '../../mocks';
import {
  rayLaravelEloquentMock,
  rayLaravelEventsMock,
  rayLaravelJobsMock,
  rayLaravelQueryMock,
  rayLaravelQueryNoBindingsMock,
  rayLaravelViewsMock,
  rayLaravelApplicationLogMock,
} from '../../mocks-laravel';
import PreviewCard from './preview-card.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: 'Entities/ray/PreviewCard',
  component: PreviewCard,
} as Meta<typeof PreviewCard>;

export const BooleanTrue: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayBooleanTrueMock) },
};

export const BooleanFalse: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayBooleanFalseMock) },
};

export const Text: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayTextMock) },
};

export const EmptyText: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayEmptyStringMock) },
};

export const Trace: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayTraceMock) },
};

export const Table: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayTableMock) },
};

export const Size: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(raySizeMock) },
};

export const Notify: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayNotifyMock) },
};

export const Measure: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayMeasureStartMock) },
};

export const Label: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLabelMock) },
};

export const Json: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayJsonMock) },
};

export const Image: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayImageMock) },
};

export const Hide: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayHideMock) },
};

export const Exception: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayExceptionMock) },
};

export const Dump: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayDumpMock) },
};

export const Counter: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayCounterMock) },
};

export const Color: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayColorMock) },
};

export const Carbon: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayCarbonMock) },
};

export const Int: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayIntegerMock) },
};

export const Caller: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayCallerMock) },
};

export const Lock: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLockMock) },
};

export const LaravelQuery: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelQueryMock) },
};

export const LaravelQuery2: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelQueryNoBindingsMock) },
};

export const LaravelEloquent: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelEloquentMock) },
};

export const LaravelViews: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelViewsMock) },
};

export const LaravelEvents: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelEventsMock) },
};

export const LaravelJobs: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelJobsMock) },
};

export const LaravelApplicationLog: StoryObj<typeof PreviewCard> = {
  args: { event: normalizeRayEvent(rayLaravelApplicationLogMock) },
};
