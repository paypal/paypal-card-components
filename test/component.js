/* @flow */

import '../src/index';
import assert from 'assert';

import btClient from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

import rejectIfResolves from './utils/reject-if-resolves';

describe('hosted-fields-component', () => {
    let btClientCreate;
    let client;
    let fakeBtClient;
    let fakeHostedFieldsInstance;
    let hostedFieldsCreate;
    let renderOptions;

    beforeEach(() => {
        client = window.paypal.client({
            env:  'production',
            auth: {
                production: 'PROD'
            }
        });
        renderOptions = {
            payment: () => 'order-id'
        };
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

    it('rejects if no auth is provided', () => {
        client = window.paypal.client({
            env:  'production'
        });

        return client.HostedFields.render(renderOptions).then(rejectIfResolves).catch((err) => {
            assert.equal(err.message, 'Invalid auth encountred. Check how you are creating your client.');
        });
    });

    it('rejects if no payments function is provided', () => {
        client = window.paypal.client({
            env:  'production'
        });

        return client.HostedFields.render(renderOptions).then(rejectIfResolves).catch((err) => {
            assert.equal(err.message, 'Invalid auth encountred. Check how you are creating your client.');
        });
    });

    it('rejects with an error if braintree-web.client errors out', () => {
        let error = new Error('Some BT Web client Error');

        td.when(btClientCreate(td.matchers.isA(Object))).thenReject(error);

        return client.HostedFields.render(renderOptions).then(rejectIfResolves).catch((err) => {
            td.verify(hostedFieldsCreate(td.matchers.anything()), {
                times: 0
            });
            assert.equal(err.message, 'Some BT Web client Error');
        });
    });

    it('rejects with an error if braintree-web.hosted-fields errors out', () => {
        let error = new Error('Some BT Web Error');

        td.when(hostedFieldsCreate(td.matchers.isA(Object))).thenReject(error);

        return client.HostedFields.render(renderOptions).then(rejectIfResolves).catch((err) => {
            assert.equal(err.message, 'Some BT Web Error');
        });
    });

    it('should create a Braintree client and Hosted Fields instance with configuration', () => {
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

    it('resolves with an object that can tokenize', () => {
        return client.HostedFields.render(renderOptions).then((handler) => {
            let options = {};

            return handler.submit(options);
        }).then(() => {
            td.verify(fakeHostedFieldsInstance.tokenize({
                orderId: 'order-id'
            }));
        });
    });

    it('resolves with a hosted fields instance', () => {
        return client.HostedFields.render(renderOptions).then((handler) => {
            assert.equal(handler, fakeHostedFieldsInstance);
        });
    });
});
