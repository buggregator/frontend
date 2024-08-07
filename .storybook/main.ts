import fs from "node:fs";
import path from 'node:path';
import vue from '@vitejs/plugin-vue'
import {fileURLToPath} from "url";

//storybook-tailwind-dark-mode
const config = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
    "../components/**/*.stories.@(js|jsx|ts|tsx)",
    "../layouts/**/*.stories.@(js|jsx|ts|tsx)",
    "../pages/**/*.stories.@(js|jsx|ts|tsx)",
    "../src/**/**/**/*.stories.@(js|jsx|ts|tsx)",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],

  framework: {
    name: "@storybook/vue3-vite",
    options: {}
  },

  env: (config) => {
    const iconComponentFolder = path.resolve(__dirname, '../src/shared/ui/icon-svg/icon-svg-originals');
    const allIconNamesList = !fs.existsSync(iconComponentFolder)
      ? []
      : fs
        .readdirSync(iconComponentFolder, { withFileTypes: true })
        .filter(Boolean)
        .filter((dirent) => dirent.isFile())
        .map((dirent) => path.parse(dirent.name).name)
        .filter((name) => !String(name).includes('IconSvg'))
        .join();

    return {
      ...config,
      STORYBOOK_ICON_SVG_NAMES: allIconNamesList,
    }},

  viteFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '#app': fileURLToPath(new URL('../node_modules/nuxt/dist/app', import.meta.url)),
      '~/src': fileURLToPath(new URL('../src', import.meta.url)),
      '#build': fileURLToPath(new URL('../.nuxt', import.meta.url)),
    }

    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
      plugins: [vue()],
    });
  }
};

export default config;
