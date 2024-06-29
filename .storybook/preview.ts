import {createPinia} from 'pinia';
import { setup } from '@storybook/vue3';
import "../src/assets/index.css";
import "../src/assets/vendor";
import "./stories.css"
import SfdumpWrap from "../src/shared/lib/vendor/dumper";
import 'tailwindcss/tailwind.css'
import type { Preview } from '@storybook/vue3'

const preview: Preview = {
  decorators: [
    (_, { parameters, globals }) => {
      const html = window?.document?.querySelector('html');

      if (html) {
        const oldClass = html.classList.value
        const newClass = parameters?.backgrounds.values.find(({ value }) => globals.backgrounds.value === value)?.class

        if (newClass) {
          if (oldClass) {
            html.classList.remove(oldClass)
          }

          html.classList.add(newClass)
        }
      }

      return { template: '<story/>' };
    }
  ],
  parameters: {
    actions: {argTypesRegex: "^on[A-Z].*"},
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'light',
          value: '#ffffff',
          class: 'light'
        },
        {
          name: 'dark',
          value: '#333333',
          class: 'dark'
        },
      ],
    },
  },
};


const pinia = createPinia();

setup((app) => {
  app.use(pinia)
})

declare global {
  interface Window {
    Sfdump: (id: string) => void;
  }
}
window.Sfdump = SfdumpWrap(window.document)

export default preview;
