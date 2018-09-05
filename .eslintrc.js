/* @flow */

module.exports = {
  extends: './node_modules/grumbler-scripts/config/.eslintrc.js',

  globals: {
    __hosted_fields__: true,
    __ENV__: true
  },

  rules: {
    indent: [2, 2, {SwitchCase: 1}],
  }
};
