import type { Meta, StoryObj } from "@storybook/vue3";
import { useVarDump } from "@/entities/var-dump";
import { varDumpObjectMock } from '@/entities/var-dump/mocks';
import VarDump from './var-dump-page.vue';

const { normalizeVarDumpEvent } = useVarDump();

export default {
  title: "Screens/VarDump/VarDumpPage",
  component: VarDump
} as Meta<typeof VarDump>;


export const Default: StoryObj<typeof VarDump> = {
  args: {
    event: normalizeVarDumpEvent(varDumpObjectMock),
  }
}
