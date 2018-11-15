/* @flow */

import { getKarmaConfig } from 'grumbler-scripts/config/karma.conf';
import { getWebpackConfig } from 'grumbler-scripts/config/webpack.config';

import globals from './globals';

const hostedFieldsGlobal = {
  serverConfig: {
    fundingEligibility: {
      card: () => 'window.TEST_CARD_ELIGIBILITY'
    }
  }
};

export default (karma : Object) =>
  karma.set(getKarmaConfig(karma, {
    client: {
      captureConsole: true
    },
    basePath: __dirname,
    webpack:  getWebpackConfig({
      vars: {
        ...globals,
        __hosted_fields__:  hostedFieldsGlobal,

        __CLIENT_ID__:      'xyz',
        __MERCHANT_ID__:    'abc',
        __LOCALE_COUNTRY__: 'US',
        __DEFAULT_LANG__:   'en',

        __INTENT__: 'capture',
        __COMMIT__: true,
        __VAULT__:  true,

        __PORT__:           8000,
        __STAGE_HOST__:     'msmaster.qa.paypal.com',
        __HOST__:           'test.paypal.com',
        __HOSTNAME__:       'test.paypal.com',
        __PATH__:           '/sdk/js',
        __CORRELATION_ID__: 'abc123',
        __VERSION__:        '1.0.55',
        __NAMESPACE__:      'testpaypal'
      }
    })
  }));
