/* @flow */

module.exports = {
  extends: './node_modules/grumbler-scripts/config/.eslintrc.js',

  globals: {
    FEATURE_Y: true
  },

  rules: {
    indent: [2, 2, {SwitchCase: 1}],
  }
};
