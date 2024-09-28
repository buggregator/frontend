import eslintPluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintPluginJs from '@stylistic/eslint-plugin-js';
import eslintPluginTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from 'typescript-eslint';
import eslintJs from '@eslint/js';

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
    ],
  },
  eslintJs.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  eslintPluginPrettierRecommended,
  ...compat.extends('@vue/eslint-config-typescript/recommended'),
  ...compat.extends('@vue/eslint-config-prettier/skip-formatting'),
  ...compat.extends('plugin:@conarti/feature-sliced/recommended'),
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
      // TODO: add airbnb strict rules
      // @vue3/recommended
      'vue/comment-directive': 'error',
      'vue/jsx-uses-vars': 'error',
      'vue/attributes-order': 'error',
      'vue/component-tags-order': 'error',
      'vue/no-lone-template': 'error',
      'vue/no-multiple-slot-args': 'error',
      'vue/no-v-html': 'error',
      'vue/order-in-components': 'error',
      'vue/this-in-template': 'error',
      // plugin:vue/vue3-strongly-recommended
      'vue/attribute-hyphenation': 'error',
      'vue/component-definition-name-casing': 'error',
      'vue/first-attribute-linebreak': 'error',
      'vue/html-closing-bracket-newline': 'error',
      'vue/html-closing-bracket-spacing': 'error',
      'vue/html-end-tags': 'error',
      'vue/html-indent': 'error',
      'vue/html-quotes': 'error',
      'vue/html-self-closing': 'error',
      'vue/max-attributes-per-line': 'error',
      'vue/multiline-html-element-content-newline': 'error',
      'vue/mustache-interpolation-spacing': 'error',
      'vue/no-multi-spaces': 'error',
      'vue/no-spaces-around-equal-signs-in-attribute': 'error',
      'vue/no-template-shadow': 'error',
      'vue/one-component-per-file': 'error',
      'vue/prop-name-casing': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/require-prop-types': 'error',
      'vue/singleline-html-element-content-newline': 'error',
      'vue/v-bind-style': 'error',
      'vue/v-on-event-hyphenation': [
        'error',
        'always',
        {
          autofix: true,
        },
      ],
      'vue/v-on-style': 'error',
      'vue/v-slot-style': 'error',
      // airbnb-base
    },
  },
);
