export default {
  camelcase: [
    'error',
    {
      ignoreDestructuring: false,
      properties: 'never',
    },
  ],
  'capitalized-comments': [
    'off',
    'never',
    {
      block: {
        ignoreConsecutiveComments: true,
        ignoreInlineComments: true,
        ignorePattern: '.*',
      },
      line: {
        ignoreConsecutiveComments: true,
        ignoreInlineComments: true,
        ignorePattern: '.*',
      },
    },
  ],
  'func-style': ['error', 'expression'],
  'id-length': 'off',
  'new-parens': 'error',
  'newline-after-var': ['error', 'always'],
  'no-array-constructor': 'error',
  'no-bitwise': 'error',
  'no-continue': 'error',
  'no-lonely-if': 'error',
  'no-multi-assign': ['error'],
  'no-multi-spaces': [
    'error',
    {
      ignoreEOLComments: false,
    },
  ],
  'no-negated-condition': 'error',
  'no-nested-ternary': 'error',
  'no-new-object': 'error',
  'no-plusplus': 'error',
  'no-restricted-syntax': [
    'error',
    {
      message:
        'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      selector: 'ForInStatement',
    },
    {
      message:
        'iterators/generators require regenerator-runtime, which is too heavyweight for this guide to allow them. Separately, loops should be avoided in favor of array iterations.',
      selector: 'ForOfStatement',
    },
    {
      message:
        'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      selector: 'LabeledStatement',
    },
    {
      message:
        '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      selector: 'WithStatement',
    },
  ],
  'no-spaced-func': 'error',
  'no-tabs': 'error',
  'no-underscore-dangle': [
    'error',
    {
      allow: [],
      allowAfterSuper: false,
      allowAfterThis: false,
      enforceInMethodNames: true,
    },
  ],
  'no-unneeded-ternary': ['error'],
  'no-whitespace-before-property': 'error',
  'one-var': ['error', 'never'],
  'operator-assignment': ['error', 'always'],
  'prefer-exponentiation-operator': 'error',
  'prefer-object-spread': 'error',
  'sort-keys': [
    'error',
    'asc',
    {
      caseSensitive: false,
      natural: true,
      minKeys: 5,
    },
  ],
  'sort-vars': 'error',
  'unicode-bom': ['error', 'never'],
};
