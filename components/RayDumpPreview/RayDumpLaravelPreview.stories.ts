import { Meta, Story } from "@storybook/vue3";
import RayDumpPreview from '~/components/RayDumpPreview/RayDumpPreview.vue';
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
import {
  rayLaravelQueryMock,
  rayLaravelQueryNoBindingsMock,
  rayLaravelEloquentMock,
  rayLaravelViewsMock,
  rayLaravelEventsMock,
  rayLaravelJobsMock,
} from '~/src/entities/ray/mocks-laravel';

export default {
  title: "RayDump/RayDumpPreview/Laravel",
  component: RayDumpPreview
} as Meta<typeof RayDumpPreview>;

const Template: Story = (args) => ({
  components: { RayDumpPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<RayDumpPreview v-bind="args" />`,
});

export const Query = Template.bind({});
Query.args = {event: normalizeRayDumpEvent(rayLaravelQueryMock),};

export const Query2 = Template.bind({});
Query2.args = {event: normalizeRayDumpEvent(rayLaravelQueryNoBindingsMock),};

export const Eloquent = Template.bind({});
Eloquent.args = {event: normalizeRayDumpEvent(rayLaravelEloquentMock),};

export const Views = Template.bind({});
Views.args = {event: normalizeRayDumpEvent(rayLaravelViewsMock),};

export const Events = Template.bind({});
Events.args = {event: normalizeRayDumpEvent(rayLaravelEventsMock),};

export const Jobs = Template.bind({});
Jobs.args = {event: normalizeRayDumpEvent(rayLaravelJobsMock),};
