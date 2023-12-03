import type { Meta, Story } from "@storybook/vue3";
import { useVarDump } from "../../lib";
import {
  varDumpArrayMock,
  varDumpFalseMock,
  varDumpTrueMock,
  varDumpNumberMock,
  varDumpObjectMock,
  varDumpStringMock,
  varDumpEmptyStringMock,
} from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeVarDumpEvent } = useVarDump();

export default {
  title: "Entities/var-dump/PreviewCard",
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

export const Object = Template.bind({});

Object.args = {
  event: normalizeVarDumpEvent(varDumpObjectMock),
};

export const Number = Template.bind({});

Number.args = {
  event: normalizeVarDumpEvent(varDumpNumberMock),
};

export const String = Template.bind({});

String.args = {
  event: normalizeVarDumpEvent(varDumpStringMock),
};

export const StringEmpty = Template.bind({});

StringEmpty.args = {
  event: normalizeVarDumpEvent(varDumpEmptyStringMock),
};

export const BooleanTrue = Template.bind({});

BooleanTrue.args = {
  event: normalizeVarDumpEvent(varDumpTrueMock),
};

export const BooleanFalse = Template.bind({});
BooleanFalse.args = {
  event: normalizeVarDumpEvent(varDumpFalseMock),
};


export const Array = Template.bind({});

Array.args = {
  event: normalizeVarDumpEvent(varDumpArrayMock),
};
