/* @flow */

import { getKarmaConfig } from 'grumbler-scripts/config/karma.conf';
import { getWebpackConfig } from 'grumbler-scripts/config/webpack.config';
import type { SDKGlobalType } from 'paypal-braintree-web-client/src/types';

import type { HostedFieldsGlobalType } from './src/types';

let sdkGlobal : SDKGlobalType = {
    queryOptions: {
        env:    'test',
        locale: {
            country: 'US',
            lang:    'en'
        },
        merchantID: 'XXXXXXX',
        components: [ 'hosted-fields' ]
    }
};

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
        basePath: __dirname,
        webpack:  getWebpackConfig({
            vars: {
                __sdk__:           sdkGlobal,
                __hosted_fields__: hostedFieldsGlobal
            }
        })
    }));
