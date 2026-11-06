import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useRay } from "../../lib";
import { rayLaravelMailableMock } from '../../mocks-laravel'
import type { RayContentMail } from "../../types";
import RayMail from "./ray-mail.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/Ray/RayMail",
  component: RayMail
} as Meta<typeof RayMail>;


export const Default: StoryObj<typeof RayMail> = {
  args: {
    content: (normalizeRayEvent(rayLaravelMailableMock).payload.payloads[0].content as RayContentMail)
  }
}


// Mail HTML with an inline handler: before the fix it ran in the app page,
// now it is shown in a sandboxed frame and nothing runs.
export const HtmlWithScript: StoryObj<typeof RayMail> = {
  args: {
    content: {
      ...(normalizeRayEvent(rayLaravelMailableMock).payload.payloads[0].content as RayContentMail),
      html: `<h1>Hello</h1>
<img src="x" onerror="document.title = 'pwned by onerror'">
<p><a href="https://example.com">Link without target</a></p>`,
    }
  }
}
