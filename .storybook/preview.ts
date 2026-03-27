import 'highlight.js/lib/common';
import {createPinia} from 'pinia';
import { setup } from '@storybook/vue3-vite';
import "../src/assets/index.css";
import "./stories.css"
import type { Preview } from '@storybook/vue3-vite'
import {createAppRouter} from "../src/app/router";

const preview: Preview = {
  decorators: [
    (_, { parameters, globals }) => {
      const html = window?.document?.querySelector('html');

      if (html) {
        const bgOptions = parameters?.backgrounds?.options || {}
        const allThemes = Object.values(bgOptions) as Array<{ name: string; value: string; class: string }>
        const themeClassNames = allThemes.map(({ class: className }) => className)

        const oldClasses = html.classList.value
          .trim()
          .split(' ')
          .filter((className) => themeClassNames.includes(className))
          .filter(Boolean)
        const selectedValue = globals?.backgrounds?.value
        const newClass = allThemes.find(({ value }) => selectedValue === value)?.class

        if (newClass) {
          if (oldClasses.length) {
            html.classList.remove(...oldClasses)
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
      options: {
        light: {
          name: 'Light',
          value: '#f9fafb',
          class: 'light'
        },
        dark: {
          name: 'Dark',
          value: '#111827',
          class: 'dark'
        }
      }
    },
  },

  initialGlobals: {
    backgrounds: {
      value: '#111827'
    }
  }
};


const pinia = createPinia();
const router = createAppRouter();

setup((app) => {
  app.use(pinia)
  app.use(router)
})

export default preview;
