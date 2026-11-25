import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { HTMLCode } from '../../mocks'
import EmailHtmlFrame from './email-html-frame.vue';

export default {
  title: "Shared/EmailHtmlFrame",
  component: EmailHtmlFrame,
  render: (args) => ({
    components: { EmailHtmlFrame },
    setup() {
      return { args };
    },
    template: `<div style="height: 100vh"><EmailHtmlFrame v-bind="args" /></div>`,
  })
} as Meta<typeof EmailHtmlFrame>;

export const Default: StoryObj<typeof EmailHtmlFrame> = {
  args: {
    html: HTMLCode,
  }
};

// Nothing here may run: the console shows "Blocked script execution in
// 'about:srcdoc'" and the page title and storage stay untouched.
export const WithScript: StoryObj<typeof EmailHtmlFrame> = {
  args: {
    html: `<h1>Hello</h1>
<script>parent.document.title = 'pwned'; document.body.append(localStorage.length)</script>
<img src="x" onerror="parent.document.title = 'pwned by onerror'">
<a href="javascript:parent.document.title='pwned by link'">javascript: link</a>`,
  }
};

// Both links open in a new tab, the one without a target too.
export const WithLinks: StoryObj<typeof EmailHtmlFrame> = {
  args: {
    html: `<p><a href="https://example.com">Link without target</a></p>
<p><a href="https://example.com" target="_blank">Link with target="_blank"</a></p>`,
  }
};

// A sender's own page (html events, Ray html()): its scripts run, still in an
// opaque origin; `fit` makes the frame as tall as the page.
export const PageWithScripts: StoryObj<typeof EmailHtmlFrame> = {
  args: {
    scripts: true,
    fit: true,
    html: `<!doctype html><style>body{font-family:sans-serif}</style>
<h1>Built by a script</h1><ul id="l"></ul>
<script>for (let i = 1; i <= 8; i++) l.insertAdjacentHTML('beforeend', '<li>row ' + i + '</li>')</script>`,
  }
};
