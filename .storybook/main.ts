import fs from "node:fs";
import path from 'node:path';
import {fileURLToPath} from "url";

//storybook-tailwind-dark-mode
const config = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
    "../src/**/**/**/*.stories.@(js|jsx|ts|tsx)",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],

  framework: {
    name: "@storybook/vue3-vite",
    options: {
    }
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
      '@/src': fileURLToPath(new URL('../src', import.meta.url)),
    }

    return config;
  }
};

export default config;
