/* @flow */
/* eslint import/no-commonjs: 0 */

const globals = require("./globals");

module.exports = {
  "hosted-fields": {
    entry: "./src/index",
    setupHandler: "setupHostedFields",
    globals,
  },
  "hosted-fields-contingency": {
    entry: "./src/contingency-flow",
    globals,
  },
};
