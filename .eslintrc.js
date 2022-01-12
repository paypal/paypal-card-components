/* @flow */

module.exports = {
  extends: './node_modules/grumbler-scripts/config/.eslintrc-browser.js',

  globals: {
    __ENV__: true
  },

  rules: {
    indent: [2, 2, {SwitchCase: 1}],
  }
};
