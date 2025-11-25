module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  globals: {
    process: 'readonly',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '**/*.config.js',
    '*.config.js',
    'src/test/setup.js',
    'tests/**/*.js',
    'tests/**/*.jsx',
    '**/*.test.js',
    '**/*.test.jsx',
  ],
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
    'no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-case-declarations': 'off',
  },
}

