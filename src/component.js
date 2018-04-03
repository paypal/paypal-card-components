/* @flow */
/* eslint no-console: 0 */

// Pull in the common client
import { attach } from 'paypal-braintree-web-client/src';

// Attach to public api
attach(({ clientOptions, clientConfig, serverConfig, queryOptions }) => {

    // Read from merchant-passed options
    console.log('Client tokens:', clientOptions.auth);

    // Set a shared client config key
    clientConfig.set('credit_fields_handled', true);

    // Read a shared client config key
    console.log('Config foo:', clientConfig.get('credit_fields_handled'));

    // Read a server config key
    console.log('Logger url', serverConfig.urls.logger);

    // Read a query option key
    console.log('Merchant id', queryOptions.merchantID);

    // Expose public apis
    return {

        HostedFields: {
            render(options, container) {

                if (!options.buttonText) {
                    throw new Error(`Expected options.buttonText`);
                }

                if (FEATURE_Y) {
                    console.log('Feature Y is enabled!');
                }

                document.querySelector(container).innerHTML =
                    `<button>${ options.buttonText }</button>`;
            }
        },

        HOSTED_FIELDS_CONSTANTS: {
            FOO: 'FOO',
            BAR: 'BAR'
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
