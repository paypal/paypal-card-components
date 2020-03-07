/* @flow */
/* eslint import/no-commonjs: 0 */

const globals = require('./globals');

module.exports = {
  'hosted-fields': {
    entry:           './src/index',
    setupHandler:    'setupHostedFields',
    staticNamespace: '__hosted_fields__',
    configQuery:     `
      fundingEligibility {
        card {
          branded
          vendors {
            visa {
              eligible
            }
            mastercard {
              eligible
            }
            amex {
              eligible
            }
            discover {
              eligible
            }
            hiper {
              eligible
            }
            elo {
              eligible
            }
            jcb {
              eligible
            }
          }
        }
      }
    `,
    globals
  },
  'hosted-fields-contingency': {
    entry: './src/contingency-flow',
    globals
  }
};
