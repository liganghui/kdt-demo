/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  globals: {
    // 全局变量避免eslint no-undef 提示
    Konva: true,
    t: true
  },
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'import/no-unresolved': ['error', { caseSensitive: false }],
    'import/extensions': ['off', 'never'],
    'vue/multi-word-component-names': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
}
