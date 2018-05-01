/* @flow */
/* eslint import/no-commonjs: 0 */

const globals = require('./globals');

module.exports = {
  'hosted-fields': {
    entry:           './src/index',
    staticNamespace: '__hosted_fields__',
    configQuery:     `
      clientConfiguration {
        assetsUrl
      }
    `,
    globals
  },
  'hosted-fields-contingency': {
    entry: './src/contingency-flow',
    globals
  }
};
