import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
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
} from '../../mocks';
import {
  rayLaravelEloquentMock, rayLaravelEventsMock, rayLaravelJobsMock,
  rayLaravelQueryMock,
  rayLaravelQueryNoBindingsMock, rayLaravelViewsMock, rayLaravelApplicationLogMock
} from "../../mocks-laravel";
import PreviewCard from './preview-card.vue';

const { normalizeRayEvent } = useRay()

export default {
  title: "Entities/ray/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: Story = (args) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
});

export const Text = Template.bind({});
Text.args = {event: normalizeRayEvent(rayTextMock),};

export const EmptyText = Template.bind({});
EmptyText.args = {event: normalizeRayEvent(rayEmptyStringMock),};

export const Trace = Template.bind({});
Trace.args = {event: normalizeRayEvent(rayTraceMock),};

export const Table = Template.bind({});
Table.args = {event: normalizeRayEvent(rayTableMock),};

export const Size = Template.bind({});
Size.args = {event: normalizeRayEvent(raySizeMock),};

export const Notify = Template.bind({});
Notify.args = {event: normalizeRayEvent(rayNotifyMock),};

export const Measure = Template.bind({});
Measure.args = {event: normalizeRayEvent(rayMeasureStartMock),};

export const Label = Template.bind({});
Label.args = {event: normalizeRayEvent(rayLabelMock),};

export const Json = Template.bind({});
Json.args = {event: normalizeRayEvent(rayJsonMock),};

export const Image = Template.bind({});
Image.args = {event: normalizeRayEvent(rayImageMock),};

export const Hide = Template.bind({});
Hide.args = {event: normalizeRayEvent(rayHideMock),};

export const Exception = Template.bind({});
Exception.args = {event: normalizeRayEvent(rayExceptionMock),};

export const Dump = Template.bind({});
Dump.args = {event: normalizeRayEvent(rayDumpMock),};

export const Counter = Template.bind({});
Counter.args = {event: normalizeRayEvent(rayCounterMock),};

export const Color = Template.bind({});
Color.args = {event: normalizeRayEvent(rayColorMock),};

export const Carbon = Template.bind({});
Carbon.args = {event: normalizeRayEvent(rayCarbonMock),};

export const Int = Template.bind({});
Int.args = {event: normalizeRayEvent(rayIntegerMock),};

export const Caller = Template.bind({});
Caller.args = {event: normalizeRayEvent(rayCallerMock),};

export const Lock = Template.bind({});
Lock.args = {event: normalizeRayEvent(rayLockMock),};

export const LaravelQuery = Template.bind({});
LaravelQuery.args = {event: normalizeRayEvent(rayLaravelQueryMock),};

export const LaravelQuery2 = Template.bind({});
LaravelQuery2.args = {event: normalizeRayEvent(rayLaravelQueryNoBindingsMock),};

export const LaravelEloquent = Template.bind({});
LaravelEloquent.args = {event: normalizeRayEvent(rayLaravelEloquentMock),};

export const LaravelViews = Template.bind({});
LaravelViews.args = {event: normalizeRayEvent(rayLaravelViewsMock),};

export const LaravelEvents = Template.bind({});
LaravelEvents.args = {event: normalizeRayEvent(rayLaravelEventsMock),};

export const LaravelJobs = Template.bind({});
LaravelJobs.args = {event: normalizeRayEvent(rayLaravelJobsMock),};

export const LaravelApplicationLog = Template.bind({});
LaravelApplicationLog.args = {event: normalizeRayEvent(rayLaravelApplicationLogMock),};

