/* @flow */

import '../src/index';

import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

describe('Happy cases', () => {
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

    it('Should create a Hosted Fields instance', () => {
        let options = {};

        return client.HostedFields.render(options).then(() => {
            td.verify(create(options));
        });
    });

    it('Resolves with an object that can tokenize', () => {
        return client.HostedFields.render({}).then((handler) => {
            let options = {};

            handler.submit(options);

            td.verify(fakeHostedFieldsInstance.tokenize(options));
        });
    });
});
