/* @flow */

import '../src/index';
import assert from 'assert';

import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

function rejectIfResolves () {
    throw new Error('should not have resolved');
}

describe('Error cases', () => {
    let client;
    let create;
    let fakeHostedFieldsInstance;

    beforeEach(() => {
        client = window.paypal.client();
        fakeHostedFieldsInstance = td.object([ 'tokenize' ]);
        create = td.replace(hostedFields, 'create');

        td.when(create(td.matchers.isA(Object))).thenResolve(fakeHostedFieldsInstance);
    });

    afterEach(() => {
        td.reset();
    });

    it('rejects with an error if braintree-web.hosted-fields errors out', () => {
        let error = new Error('Some BT Web Error');

        td.when(create(td.matchers.isA(Object))).thenReject(error);

        return client.HostedFields.render({}).then(rejectIfResolves).catch((err) => {
            assert.equal(err.message, 'Something went wrong.');
        });
    });
});
