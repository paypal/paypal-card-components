/* @flow */

import '../src/index';

import btClient from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

describe('Happy cases', () => {
    let client;
    let hostedFieldsCreate;
    let btClientCreate;
    let fakeHostedFieldsInstance;
    let fakeBtClient;

    beforeEach(() => {
        client = window.paypal.client({
            env:  'production',
            auth: {
                production: 'PROD'
            }
        });
        btClientCreate = td.replace(btClient, 'create');

        fakeHostedFieldsInstance = td.object([ 'tokenize' ]);
        hostedFieldsCreate = td.replace(hostedFields, 'create');

        fakeBtClient = {
            getConfiguration: (conf) => conf
        };

        td.when(hostedFieldsCreate(td.matchers.isA(Object))).thenResolve(fakeHostedFieldsInstance);
        td.when(btClientCreate(td.matchers.isA(Object))).thenResolve(fakeBtClient);
    });

    afterEach(() => {
        td.reset();
    });

    it('Should create a Braintree client and Hosted Fields instance with configuration', () => {
        let renderOptions = {
            payment: () => {
                return 'order-id';
            }
        };

        return client.HostedFields.render(renderOptions).then(() => {
            td.verify(btClientCreate({
                authorization: 'PROD',
                configuration: td.matchers.isA(Object)
            }));
            td.verify(hostedFieldsCreate({
                client:      fakeBtClient,
                paymentsSdk: true
            }));
        });
    });

    it('Resolves with an object that can tokenize', () => {
        let renderOptions = {
            payment: () => {
                return 'order-id';
            }
        };
        return client.HostedFields.render(renderOptions).then((handler) => {
            let options = {};

            return handler.submit(options);
        }).then(() => {
            td.verify(fakeHostedFieldsInstance.tokenize({
                orderId: 'order-id'
            }));
        });
    });
});
