/* @flow */
/* eslint import/no-default-export: off */

import { getKarmaConfig } from "@krakenjs/karma-config-grumbler";
import { getWebpackConfig } from "@krakenjs/webpack-config-grumbler";

import globals from './globals';

const fundingEligibility = {
  card: {
    eligible: true,
    branded:  false,

    vendors: {
      visa: {
        eligible: true
      },
      mastercard: {
        eligible: true
      },
      amex: {
        eligible: true
      },
      discover: {
        eligible: true
      },
      hiper: {
        eligible: false
      },
      elo: {
        eligible: false
      },
      jcb: {
        eligible: false
      }
    }
  }
};

export default (karma : Object) : void =>
  karma.set(getKarmaConfig(karma, {
    client: {
      captureConsole: true
    },
    basePath: __dirname,
    webpack:  getWebpackConfig({
      vars: {
        ...globals,

        __CLIENT_ID__:      'xyz',
        __MERCHANT_ID__:    'abc',
        __LOCALE_COUNTRY__: 'US',
        __DEFAULT_LANG__:   'en',

        __INTENT__: 'capture',
        __COMMIT__: true,
        __VAULT__:  true,

        __PORT__:               8000,
        __PAYPAL_API_DOMAIN__:  'stage.paypal.com',
        __STAGE_HOST__:         'stage.paypal.com',
        __HOST__:               'test.paypal.com',
        __HOSTNAME__:           'test.paypal.com',
        __SDK_HOST__:           'test.paypal.com',
        __PATH__:               '/sdk/js',
        __CORRELATION_ID__:     'abc123',
        __VERSION__:            '1.0.55',
        __NAMESPACE__:          'testpaypal',
        __DISABLE_SET_COOKIE__: false,

        __FUNDING_ELIGIBILITY__: fundingEligibility
      }
    })
  }));
