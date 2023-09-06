import { Meta, Story } from "@storybook/vue3";
import { normalizeVarDumpEvent } from "~/utils/normalize-event";

import varDumpObjectEventMock from '~/mocks/var-dump-object.json'
import varDumpNumberEventMock from '~/mocks/var-dump-number.json'
import varDumpStringEventMock from '~/mocks/var-dump-string.json'
import varDumpStringEmptyEventMock from '~/mocks/var-dump-string-empty.json'
import varDumpArrayEventMock from '~/mocks/var-dump-array.json'
import varDumpBoolTrueEventMock from '~/mocks/var-dump-boolean-true.json'
import varDumpBoolFalseEventMock from '~/mocks/var-dump-boolean-false.json'
import VarDumpPreview from '~/components/VarDumpPreview/VarDumpPreview.vue';

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
  event: normalizeVarDumpEvent(varDumpObjectEventMock),
};

export const Number = Template.bind({});

Number.args = {
  event: normalizeVarDumpEvent(varDumpNumberEventMock),
};

export const String = Template.bind({});

String.args = {
  event: normalizeVarDumpEvent(varDumpStringEventMock),
};

export const StringEmpty = Template.bind({});

StringEmpty.args = {
  event: normalizeVarDumpEvent(varDumpStringEmptyEventMock),
};

export const BooleanTrue = Template.bind({});

BooleanTrue.args = {
  event: normalizeVarDumpEvent(varDumpBoolTrueEventMock),
};

export const BooleanFalse = Template.bind({});
BooleanFalse.args = {
  event: normalizeVarDumpEvent(varDumpBoolFalseEventMock),
};


export const Array = Template.bind({});

Array.args = {
  event: normalizeVarDumpEvent(varDumpArrayEventMock),
};
