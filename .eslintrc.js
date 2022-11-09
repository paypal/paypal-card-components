/* @flow */

module.exports = {
  extends: "@krakenjs/eslint-config-grumbler/eslintrc-browser",

  globals: {
    __ENV__: true
  },

  rules: {
    indent: [2, 2, {SwitchCase: 1}],
    'import/no-nodejs-modules':    'off',
    'import/export':               'off',
    'import/no-unassigned-import': 'off',
    'no-console': 'off'
  }
};
