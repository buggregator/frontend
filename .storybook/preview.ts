import {createPinia} from 'pinia';
import { setup } from '@storybook/vue3';
import "../assets/index.css";
import "../assets/vendor";
import "./stories.css"
import SfdumpWrap from "../src/shared/lib/vendor/dumper";
import 'tailwindcss/tailwind.css'

export const parameters = {
  actions: {argTypesRegex: "^on[A-Z].*"},
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  themes: {
    clearable: false,
    target: 'html',
    default: 'dark',
    list: [
      {
        name: 'light',
        class: [],
        color: '#ffffff',
      },
      {
        name: 'dark',
        class: ['dark'],
        color: '#333333'
      }
    ]
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
