import {createPinia} from 'pinia';
import { setup } from '@storybook/vue3';
import "../src/assets/index.css";
import "../src/assets/vendor.css";
import "./stories.css"
import 'tailwindcss/tailwind.css'
import type { Preview } from '@storybook/vue3'
import {createAppRouter} from "../src/app/router";

const preview: Preview = {
  decorators: [
    (_, { parameters, globals }) => {
      const html = window?.document?.querySelector('html');

      if (html) {
        const themeClassNames = (parameters?.backgrounds?.values || []).map(({ class: className }) => className)

        const oldClasses = html.classList.value
          .trim()
          .split(' ')
          .filter((className) => themeClassNames.includes(className))
          .filter(Boolean)
        const newClass = (parameters?.backgrounds?.values || []).find(({ value }) => globals?.backgrounds?.value === value)?.class

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
const router = createAppRouter();

setup((app) => {
  app.use(pinia)
  app.use(router)
})

export default preview;
