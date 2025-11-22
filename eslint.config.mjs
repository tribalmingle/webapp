import js from '@eslint/js'

export default [
  {
    ignores: ['.next/', 'node_modules/', 'dist/']
  },
  {
    ...js.configs.recommended,
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  }
]
