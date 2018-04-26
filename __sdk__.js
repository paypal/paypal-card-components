/* @flow */
/* eslint import/no-commonjs: 0 */

module.exports = {
  'hosted-fields': {
    entry:           './src/index',
    staticNamespace: '__hosted_fields__',
    configQuery:     `
      clientConfiguration {
        assetsUrl
      }
    `
  }
};
