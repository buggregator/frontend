import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import LayoutSidebar from "./layout-sidebar.vue";

export default {
  title: "Widgets/LayoutSidebar",
  component: LayoutSidebar,
  render: (args: ComponentProps<typeof LayoutSidebar>) => ({
    components: { LayoutSidebar },
    setup() {
      return {
        args,
      };
    },
    template: '<div style="width: 100px; height: 100vh"><LayoutSidebar v-bind="args" /></div>',
  })
}as Meta<typeof LayoutSidebar>;

export const Default: StoryObj<typeof LayoutSidebar> = {
  args: {
    apiVersion: "v1.0.0",
    clientVersion: "v1.0.0",
  }
};

export const AuthWithImage: StoryObj<typeof LayoutSidebar> = {
  args: {
    apiVersion: "v1.0.0",
    clientVersion: "v1.0.0",
    profile: {
      username: "john_smith",
      email: "john_smith@site.com",
      avatar: "https://loremflickr.com/cache/resized/65535_52444232377_93913f3504_n_320_240_nofilter.jpg"
    }
  }
};

export const AuthWithSvg: StoryObj<typeof LayoutSidebar> = {
  args: {
    apiVersion: "v1.0.0",
    clientVersion: "v1.0.0",
    profile: {
      username: "john_smith",
      email: "john_smith@site.com",
      avatar: "<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; xmlns:xlink=&quot;http://www.w3.org/1999/xlink&quot; viewBox=&quot;0 0 144.8 144.8&quot; xml:space=&quot;preserve&quot;><circle style=&quot;fill:#f5c002&quot; cx=&quot;72.4&quot; cy=&quot;72.4&quot; r=&quot;72.4&quot;/><defs><circle id=&quot;a&quot; cx=&quot;72.4&quot; cy=&quot;72.4&quot; r=&quot;72.4&quot;/></defs><clipPath id=&quot;b&quot;><use xlink:href=&quot;#a&quot; style=&quot;overflow:visible&quot;/></clipPath><g style=&quot;clip-path:url(#b)&quot;><path style=&quot;fill:#f1c9a5&quot; d=&quot;M107 117c-5-9-35-14-35-14s-30 5-34 14l-7 28h82s-2-17-6-28z&quot;/><path style=&quot;fill:#e4b692&quot; d=&quot;M72 103s30 5 35 14c4 11 6 28 6 28H72v-42z&quot;/><path style=&quot;fill:#f1c9a5&quot; d=&quot;M64 85h17v27H64z&quot;/><path style=&quot;fill:#e4b692&quot; d=&quot;M72 85h9v27h-9z&quot;/><path style=&quot;opacity:.1;fill:#ddac8c&quot; d=&quot;M64 97c2 4 8 7 12 7l5-1V85H64v12z&quot;/><path style=&quot;fill:#f1c9a5&quot; d=&quot;M93 67c0-17-9-26-21-26-11 0-21 9-21 26 0 23 10 31 21 31 12 0 21-9 21-31z&quot;/><path style=&quot;fill:#e4b692&quot; d=&quot;M90 79c-4 0-6-4-6-9 1-5 5-8 9-8 3 1 6 5 5 9 0 5-4 9-8 8z&quot;/><path style=&quot;fill:#f1c9a5&quot; d=&quot;M47 71c-1-4 2-8 5-9 4 0 8 3 8 8 1 5-1 9-5 9-4 1-8-3-8-8z&quot;/><path style=&quot;fill:#e4b692&quot; d=&quot;M93 67c0-17-9-26-21-26v57c12 0 21-9 21-31z&quot;/><path style=&quot;fill:#303030&quot; d=&quot;M91 82c-1 3-3 7-6 7-5 0-8-4-13-4s-8 4-12 4c-3 0-5-4-7-7v-6 7s1 8 4 11c3 2 11 6 15 6 5 0 13-4 15-6 4-3 5-11 5-11v-7l-1 6zM62 44s4 16 26 24l-3-8 10 7c3-7 7-16-2-21-8-6-28-15-31-2z&quot;/><path style=&quot;fill:#303030&quot; d=&quot;M55 66s2-18 8-22c-5-2-14 5-13 10l5 12z&quot;/><path style=&quot;fill:#fb621e&quot; d=&quot;M107 117c-3-5-14-9-23-12a12 12 0 0 1-23 0c-9 3-21 7-23 12l-7 28h82s-2-17-6-28z&quot;/><path style=&quot;opacity:.2;fill:#e53d0c&quot; d=&quot;M60 108c0 6 6 11 12 11 7 0 12-5 13-11 8 2 18 6 22 10v-1c-3-5-14-9-23-12a12 12 0 0 1-23 0c-9 3-21 7-23 12l-1 1c5-4 15-8 23-10z&quot;/><path style=&quot;fill:#e53d0c&quot; d=&quot;M57 106a15 15 0 0 0 30 0l-3-1a12 12 0 0 1-23 0l-4 1z&quot;/><path style=&quot;fill:#fff&quot; d=&quot;M76 91s-1-3-4-3c-2 0-3 3-3 3h7z&quot;/></g></svg>"
    }
  }
};
