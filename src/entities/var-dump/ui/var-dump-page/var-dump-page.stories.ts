import type { Meta, StoryObj } from "@storybook/vue3";
import { useVarDump } from "../../lib";
import { varDumpObjectMock } from '../../mocks';
import VarDump from './var-dump-page.vue';

const { normalizeVarDumpEvent } = useVarDump();

export default {
  title: "Entities/VarDump/VarDumpPage",
  component: VarDump,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof VarDump>;


export const Default: StoryObj<typeof VarDump> = {
  args: {
    event: normalizeVarDumpEvent(varDumpObjectMock),
  }
}
