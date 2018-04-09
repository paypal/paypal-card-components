/* @flow */

import '../src/index';
import assert from 'assert';

import btClient from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

function rejectIfResolves () {
    throw new Error('should not have resolved');
}

describe('Error cases', () => {
    let client;
    let hostedFieldsCreate;
    let btClientCreate;
    let fakeHostedFieldsInstance;
    let fakeBtClient;
    let renderOptions;

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
        renderOptions = {
            payment: () => {
                return 'order-id';
            }
        };
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
});
