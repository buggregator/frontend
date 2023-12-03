import type { Meta, Story } from "@storybook/vue3";
import TableBaseRow from "./table-base-row.vue";
import TableBase from "./table-base.vue";

export default {
  title: "Shared/TableBase",
  component: TableBase
} as Meta<typeof TableBase>;

const TableTemplate: Story = (args) => ({
  components: { TableBase, TableBaseRow },
  setup() {
    return {
      args,
    };
  },
  template: `<TableBase>
    <TableBaseRow title="Row 1">
      This is a row 1
    </TableBaseRow>
    <TableBaseRow title="Row 2">
      This is a row 2
    </TableBaseRow>
    <TableBaseRow title="Row 3">
      This is a row 3
    </TableBaseRow>
  </TableBase>`,
});

export const Default = TableTemplate.bind({});
Default.args = {};

const TableWithoutTitlesTemplate: Story = (args) => ({
  components: { TableBase, TableBaseRow },
  setup() {
    return {
      args,
    };
  },
  template: `<TableBase>
    <TableBaseRow>
      This is a row 1
    </TableBaseRow>
    <TableBaseRow>
      This is a row 2
    </TableBaseRow>
    <TableBaseRow>
      This is a row 3
    </TableBaseRow>
  </TableBase>`,
});
export const NoTitles = TableWithoutTitlesTemplate.bind({});
NoTitles.args = {};

const RowOnlyTemplate: Story = (args) => ({
  components: { TableBase, TableBaseRow },
  setup() {
    return {
      args,
    };
  },
  template: `<TableBaseRow title="">This is a row 1</TableBaseRow>`,
});
export const RowOnly = RowOnlyTemplate.bind({});
RowOnly.args = {};
