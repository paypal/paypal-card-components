/* @flow */
/* eslint no-console: 0 */

import { attach } from 'paypal-braintree-web-client/src';
import btClient from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';

import type { HostedFieldsHandler } from './types';

function createSubmitHandler (hostedFieldsInstance, orderIdFunction) : Function {
    return () => {
        return orderIdFunction().then((orderId) => {
            return hostedFieldsInstance.tokenize({
                orderId
            });
        });
    };
}

attach(({ clientOptions, serverConfig }) => {
    let { env = 'production', auth } = clientOptions;

    return {

        HostedFields: {
            render(options, buttonSelector) : Promise<HostedFieldsHandler> {
                if (!auth || !auth[env]) {
                    return Promise.reject(new Error('Invalid auth encountred. Check how you are creating your client.'));
                }

                let orderIdFunction = () => {
                    return Promise.resolve().then(() => {
                        return options.payment();
                    });
                };

                return btClient.create({
                    authorization: auth[env],
                    configuration: serverConfig
                }).then((btClientInstance) => {
                    let hostedFieldsCreateOptions = JSON.parse(JSON.stringify(options));

                    hostedFieldsCreateOptions.paymentsSdk = true;
                    hostedFieldsCreateOptions.client = btClientInstance;
                    return hostedFields.create(hostedFieldsCreateOptions);
                }).then((hostedFieldsInstance) => {
                    hostedFieldsInstance.submit = createSubmitHandler(hostedFieldsInstance, orderIdFunction);

                    if (buttonSelector && options.onAuthorize) {
                        document.querySelector(buttonSelector).addEventListener('click', () => {
                            hostedFieldsInstance.submit().then((payload) => {
                                return options.onAuthorize(payload);
                            }).catch((err) => {
                                if (options.onError) {
                                    options.onError(err);
                                }
                            });
                        });
                    }

                    return hostedFieldsInstance;
                });
            }
        },

        HOSTED_FIELDS_CONSTANTS: {
        }
    };
});
