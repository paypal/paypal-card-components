/* @flow */
/* eslint no-console: 0 */

import { attach } from 'paypal-braintree-web-client/src';
import hostedFields from 'braintree-web/hosted-fields';

import type { HostedFieldsHandler } from './types';

attach(({ clientOptions, clientConfig, serverConfig, queryOptions }) => {

    console.log('Client config:', clientConfig);

    // Read from merchant-passed options
    console.log('Client tokens:', clientOptions.auth);

    // Read a server config key
    // payment sdk will already have graph ql configuration, so bt-web does not need to make configuration request on the client
    console.log('Logger url', serverConfig.urls.logger);

    // Read a query option key
    console.log('Merchant id', queryOptions.merchantID);

    // Expose public apis
    return {

        HostedFields: {
            render(options, submitButton) : Promise<HostedFieldsHandler> { // eslint-disable-line no-unused-vars
                // reject if auth is not a valid client token
                // create options for hosted fieldw with authorization
                return hostedFields.create(options).then((hostedFieldsInstance) => {
                    return {
                        submit: (tokenizeOptions) => {
                            return hostedFieldsInstance.tokenize(tokenizeOptions);
                        }
                    };
                }).catch(() => {
                    return Promise.reject(new Error('Something went wrong.'));
                });
            }
        },

        HOSTED_FIELDS_CONSTANTS: {
        }
    };

    // Now end-user can do:
    //
    // var client = paypal.client({
    //     env: 'sandbox',
    //     auth: {
    //         sandbox:    'abc',
    //         production: 'xyz'
    //     }
    // });
    //
    // client.HostedFields.render({
    //   someOption: client.HOSTED_FIELDS_CONSTANTS.FOO
    // }, '#container');
});
