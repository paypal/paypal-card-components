/* @flow */

import { getKarmaConfig } from 'grumbler-scripts/config/karma.conf';
import { getWebpackConfig } from 'grumbler-scripts/config/webpack.config';

import globals from './globals';
import type { HostedFieldsGlobalType } from './src/types';

let hostedFieldsGlobal : HostedFieldsGlobalType = {
  serverConfig: {
    clientConfiguration: {
      assetsUrl: 'https://paypal.com/assets/'
    }
  },
  featureFlags: {

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
        __hosted_fields__: hostedFieldsGlobal
      }
    })
  }));
