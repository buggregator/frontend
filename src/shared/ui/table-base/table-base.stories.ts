import type { Meta, StoryObj } from "@storybook/vue3";
import TableBaseRow from "./table-base-row.vue";
import TableBase from "./table-base.vue";

export default {
  title: "Shared/TableBase",
  component: TableBase,
} as Meta<typeof TableBase>;

export const Default: StoryObj<typeof TableBase> = {
  render: () => ({
    components: { TableBase, TableBaseRow },
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
  })
};

export const NoTitles: StoryObj<typeof TableBase> = {
  render: () => ({
    components: { TableBase, TableBaseRow },
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
  })
};

export const RowOnly: StoryObj<typeof TableBase> = {
  render: () => ({
    components: { TableBase, TableBaseRow },
    template: `<TableBase><TableBaseRow title="">This is a row 1</TableBaseRow></TableBase>`,
  }),
};
