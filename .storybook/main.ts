// This file has been automatically migrated to valid ESM format by Storybook.
import fs from "node:fs";
import path, { dirname } from 'node:path';
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//storybook-tailwind-dark-mode
const config = {
  stories: [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)",
    "../src/**/**/**/*.stories.@(js|jsx|ts|tsx)",
  ],

  addons: ["@storybook/addon-links", "@storybook/addon-docs"],

  framework: {
    name: "@storybook/vue3-vite",
    options: {
    }
  },

  core: {
    builder: {
      name: '@storybook/builder-vite',
    },
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

    config.css = {
      ...config.css,
      preprocessorOptions: {
        scss: {
          api: 'modern',
          loadPaths: [fileURLToPath(new URL('..', import.meta.url))],
        },
      },
    }

    return config;
  }
};

export default config;
