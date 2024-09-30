import eslintPluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPluginJs from '@stylistic/eslint-plugin-js';
import eslintPluginTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from 'typescript-eslint';
import eslintJs from '@eslint/js';
import stylisticRules from './eslint-rules/stylistic-rules.js';
import eslintVueRules from './eslint-rules/vue-rules.js';
import eslintBaseRules from './eslint-rules/eslint-base-rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// TODO: implement eslint-plugin-import
// TODO: implement @conarti/eslint-plugin-feature-sliced

export default typescriptEslint.config(
  {
    ignores: [
      'package.json',
      'postcss.config.js',
      'eslint.config.js',
      'tailwind.config.js',
      'src/shared/lib/vendor/**/*.js',
      'dist/',
      'src/assets/',
      'index.html',
      '**/*.d.ts',
    ],
  },
  eslintJs.configs.recommended,
  eslintPluginPrettierRecommended,
  ...compat.extends('@vue/eslint-config-typescript/recommended'),
  ...compat.extends('@vue/eslint-config-prettier/skip-formatting'),
  ...compat.extends('plugin:@conarti/feature-sliced/recommended'),
  ...eslintPluginVue.configs['flat/recommended'],
  // ...compat.extends("plugin:eslint-plugin-import/recommended"),
  // ...compat.extends("plugin:eslint-plugin-storybook/recommended"),
  // ...compat.extends("plugin:eslint-plugin-storybook/addon-interactions"),
  // ...compat.extends("plugin:eslint-plugin-storybook/csf"),
  // ...compat.extends("plugin:eslint-plugin-storybook/csf-strict"),
  {
    plugins: {
      '@stylistic/js': eslintPluginJs,
      '@stylistic/ts': eslintPluginTs,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      ...eslintBaseRules,
      ...stylisticRules,
      ...eslintVueRules,
    },
  },
);
