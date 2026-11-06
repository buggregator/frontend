import featureSliced from '@conarti/eslint-plugin-feature-sliced'
import js from '@eslint/js'
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier/flat'
import importX from 'eslint-plugin-import-x'
import storybook from 'eslint-plugin-storybook'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

// Flat config of what .eslintrc.json had, in the same order: prettier first,
// then Vue, eslint:recommended, TypeScript, Storybook and Feature-Sliced.
export default withVueTs(
  {
    name: 'buggregator/ignores',
    ignores: [
      'dist/',
      'storybook-static/',
      'coverage/',
      'src/shared/lib/vendor/',
      'postcss.config.js',
      'tailwind.config.js'
    ]
  },
  prettier,
  pluginVue.configs['flat/recommended'],
  js.configs.recommended,
  vueTsConfigs.recommended,
  storybook.configs['flat/recommended'],
  featureSliced({
    // Type imports count too: shared importing an entity type is still a layer break (audit 1.11).
    layersSlices: { allowTypeImports: false },
    // Slice folders beside the standard ones: mocks hold Storybook/test events.
    segments: ['mocks'],
    // Mocks are story and test data, kept out of the slice public API so they stay out of the app bundle.
    publicApi: { ignoreImports: ['@/entities/*/mocks'] }
  }),
  {
    name: 'buggregator/rules',
    plugins: { 'import-x': importX },
    rules: {
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: true, ignores: [] }
      ],
      'import-x/extensions': [
        'error',
        'ignorePackages',
        { '': 'never', js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    // Build and screenshot scripts run in Node and print their report.
    name: 'buggregator/node-scripts',
    files: ['scripts/**/*.{js,mjs}', '.storybook/screenshots/**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' }
  }
)
