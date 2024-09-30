export default {
  '@stylistic/js/array-bracket-newline': ['error', { multiline: true }],
  '@stylistic/js/array-bracket-spacing': ['error', 'never'],
  '@stylistic/js/array-element-newline': [
    'error',
    {
      minItems: 3,
      multiline: true,
    },
  ],
  '@stylistic/js/block-spacing': ['error', 'always'],
  '@stylistic/js/brace-style': ['error', '1tbs'],
  '@stylistic/js/comma-dangle': [
    'error',
    {
      arrays: 'always-multiline',
      exports: 'always-multiline',
      functions: 'always-multiline',
      imports: 'always-multiline',
      objects: 'always-multiline',
    },
  ],
  '@stylistic/js/func-call-spacing': ['error', 'never'],
  '@stylistic/js/function-call-argument-newline': ['error', 'always'],
  '@stylistic/js/function-paren-newline': ['error', 'multiline-arguments'],
  '@stylistic/js/indent': [
    'error',
    2,
    {
      ArrayExpression: 1,
      CallExpression: {
        // TODO: fix eslint rule to disallow empty lines in object literals

        arguments: 1,
      },
      flatTernaryExpressions: false,
      FunctionDeclaration: {
        body: 1,
        parameters: 1,
      },
      FunctionExpression: {
        body: 1,
        parameters: 1,
      },
      ignoreComments: false,
      ignoredNodes: [
        'JSXElement',
        'JSXElement > *',
        'JSXAttribute',
        'JSXIdentifier',
        'JSXNamespacedName',
        'JSXMemberExpression',
        'JSXSpreadAttribute',
        'JSXExpressionContainer',
        'JSXOpeningElement',
        'JSXClosingElement',
        'JSXFragment',
        'JSXOpeningFragment',
        'JSXClosingFragment',
        'JSXText',
        'JSXEmptyExpression',
        'JSXSpreadChild',
      ],
      ImportDeclaration: 1,
      ObjectExpression: 1,
      outerIIFEBody: 1,
      SwitchCase: 1,
      VariableDeclarator: 1,
    },
  ],
  '@stylistic/js/jsx-quotes': ['error', 'prefer-double'],
  '@stylistic/js/key-spacing': [
    'error',
    {
      afterColon: true,
      beforeColon: false,
    },
  ],
  '@stylistic/js/keyword-spacing': [
    'error',
    {
      after: true,
      before: true,
      overrides: {
        case: { after: true },
        return: { after: true },
        throw: { after: true },
      },
    },
  ],
  '@stylistic/js/max-len': [
    'error',
    80,
    2,
    {
      ignoreComments: true,
      ignorePattern: 'd="([\\s\\S]*?)"',
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreUrls: true,
    },
  ],
  '@stylistic/js/multiline-ternary': ['error', 'always-multiline'],
  '@stylistic/js/no-mixed-operators': [
    'error',
    {
      allowSamePrecedence: false,
      groups: [
        ['%', '**'],
        ['%', '+'],
        ['%', '-'],
        ['%', '*'],
        ['%', '/'],
        ['/', '*'],
        [
          '&',
          '|',
          '<<',
          '>>',
          '>>>',
        ],
        [
          '==',
          '!=',
          '===',
          '!==',
        ],
        ['&&', '||'],
      ],
    },
  ],
  '@stylistic/js/no-mixed-spaces-and-tabs': 'error',
  '@stylistic/js/no-multiple-empty-lines': [
    'error',
    {
      max: 1,
      maxBOF: 0,
      maxEOF: 0,
    },
  ],
  '@stylistic/js/no-trailing-spaces': [
    'error',
    {
      ignoreComments: false,
      skipBlankLines: false,
    },
  ],
  '@stylistic/js/nonblock-statement-body-position': ['error', 'beside'],
  '@stylistic/js/object-curly-newline': [
    'error',
    {
      ExportDeclaration: {
        consistent: true,
        minProperties: 3,
        multiline: true,
      },
      ImportDeclaration: {
        consistent: true,
        minProperties: 3,
        multiline: true,
      },
      ObjectExpression: {
        consistent: true,
        minProperties: 3,
        multiline: true,
      },
      ObjectPattern: {
        consistent: true,
        minProperties: 3,
        multiline: true,
      },
    },
  ],
  '@stylistic/js/object-curly-spacing': ['error', 'always'],
  '@stylistic/js/object-property-newline': ['error'],
  '@stylistic/js/one-var-declaration-per-line': ['error', 'always'],
  '@stylistic/js/operator-linebreak': [
    'error',
    'before',
    { overrides: { '=': 'none' } },
  ],
  '@stylistic/js/padded-blocks': [
    'error',
    {
      blocks: 'never',
      classes: 'never',
      switches: 'never',
    },
    {
      allowSingleLineBlocks: true,
    },
  ],
  '@stylistic/js/padding-line-between-statements': ['error'],
  '@stylistic/js/quote-props': ['error', 'as-needed'],
  '@stylistic/js/quotes': [
    'error',
    'single',
    { avoidEscape: true },
  ],
  '@stylistic/js/semi': ['error', 'always'],
  '@stylistic/js/semi-spacing': [
    'error',
    {
      after: true,
      before: false,
    },
  ],
  '@stylistic/js/semi-style': ['error', 'last'],
  '@stylistic/js/space-before-blocks': 'error',
  '@stylistic/js/space-before-function-paren': [
    'error',
    {
      anonymous: 'always',
      asyncArrow: 'always',
      named: 'never',
    },
  ],
  '@stylistic/js/space-in-parens': ['error', 'never'],
  '@stylistic/js/space-infix-ops': 'error',
  '@stylistic/js/space-unary-ops': [
    'error',
    {
      nonwords: false,
      words: true,
    },
  ],
  '@stylistic/js/spaced-comment': [
    'error',
    'always',
    {
      block: {
        balanced: true,
        exceptions: ['-', '+'],
        markers: [
          '=',
          '!',
          ':',
          '::',
        ],
      },
      line: {
        exceptions: ['-', '+'],
        markers: [
          '=',
          '!',
          '/',
        ],
      },
    },
  ],
  '@stylistic/js/switch-colon-spacing': [
    'error',
    {
      after: true,
      before: false,
    },
  ],
  '@stylistic/js/template-tag-spacing': ['error'],
  '@stylistic/js/wrap-regex': 'error',
};
