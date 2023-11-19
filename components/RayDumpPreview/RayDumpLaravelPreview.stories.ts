import { Meta, Story } from "@storybook/vue3";
import RayDumpPreview from '~/components/RayDumpPreview/RayDumpPreview.vue';
import {
  rayLaravelQueryMock,
  rayLaravelQueryNoBindingsMock,
  rayLaravelEloquentMock,
  rayLaravelViewsMock,
  rayLaravelEventsMock,
  rayLaravelJobsMock,
} from '~/src/entities/ray/mocks-laravel';
import { useRay } from '~/src/entities/ray'

const { normalizeRayEvent } = useRay();

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
Query.args = {event: normalizeRayEvent(rayLaravelQueryMock),};

export const Query2 = Template.bind({});
Query2.args = {event: normalizeRayEvent(rayLaravelQueryNoBindingsMock),};

export const Eloquent = Template.bind({});
Eloquent.args = {event: normalizeRayEvent(rayLaravelEloquentMock),};

export const Views = Template.bind({});
Views.args = {event: normalizeRayEvent(rayLaravelViewsMock),};

export const Events = Template.bind({});
Events.args = {event: normalizeRayEvent(rayLaravelEventsMock),};

export const Jobs = Template.bind({});
Jobs.args = {event: normalizeRayEvent(rayLaravelJobsMock),};
