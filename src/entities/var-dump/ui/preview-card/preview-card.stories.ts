import type { Meta, StoryObj } from "@storybook/vue3";
import { useVarDump } from "../../lib";
import {
  varDumpArrayMock,
  varDumpFalseMock,
  varDumpTrueMock,
  varDumpNumberMock,
  varDumpObjectMock,
  varDumpStringMock,
  varDumpEmptyStringMock,
  varCodeMock
} from '../../mocks';
import PreviewCard from './preview-card.vue';

const {normalizeVarDumpEvent} = useVarDump();

export default {
  title: "Entities/VarDump/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpObjectMock),
  }
}

export const Number: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpNumberMock),
  }
}

export const String: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpStringMock),
  }
}

export const StringEmpty: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpEmptyStringMock),
  }
}

export const BooleanTrue: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpTrueMock),
  }
}

export const BooleanFalse: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpFalseMock),
  }
}

export const Array: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varDumpArrayMock),
  }
}

export const Code: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeVarDumpEvent(varCodeMock),
  }
}
