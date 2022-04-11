/* @flow */

// eslint-disable-next-line import/no-commonjs
module.exports = {
  extends: '../.eslintrc.js',

  rules: {
    'import/no-nodejs-modules':    'off',
    'import/export':               'off',
    'import/no-unassigned-import': 'off',
    'no-console':                  'warn'
  }
};
