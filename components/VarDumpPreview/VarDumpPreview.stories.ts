import { Meta, Story } from "@storybook/vue3";
import { normalizeVarDumpEvent } from "~/utils/normalize-event";
import VarDumpPreview from '~/components/VarDumpPreview/VarDumpPreview.vue';
import {
  varDumpArrayMock,
  varDumpFalseMock,
  varDumpTrueMock,
  varDumpNumberMock,
  varDumpObjectMock,
  varDumpStringMock,
  varDumpEmptyStringMock,
} from '~/src/entities/var-dump/mocks';

export default {
  title: "VarDump/Components/Preview",
  component: VarDumpPreview
} as Meta<typeof VarDumpPreview>;

const Template: Story = (args) => ({
  components: { VarDumpPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<VarDumpPreview v-bind="args" />`,
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
