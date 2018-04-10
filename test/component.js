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
        if (document.body) {
            document.body.innerHTML = '';
        }
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

    it('can setup click handler for provided button if onAuthorize function is passed', () => {
        let btn = document.createElement('button');
        let options = {
            payment:     td.function(),
            onAuthorize: td.function()
        };

        btn.id = 'button';
        if (document.body) {
            document.body.appendChild(btn);
        }

        td.replace(btn, 'addEventListener');

        return client.HostedFields.render(options, '#button').then(() => {
            td.verify(btn.addEventListener('click', td.matchers.isA(Function)));
        });
    });

    it('rejects render with an error if button element cannot be found', () => {
        let options = {
            payment:     td.function(),
            onAuthorize: td.function()
        };

        return client.HostedFields.render(options, '#button').then(rejectIfResolves).catch((err) => {
            assert.equal(err.message, 'Could not find selector `#button` on the page');
        });
    });

    it('calls submit when btn is clicked', () => {
        let btn = document.createElement('button');
        let options = {
            payment:     td.function(),
            onAuthorize: td.function()
        };

        btn.id = 'button';
        if (document.body) {
            document.body.appendChild(btn);
        }

        return client.HostedFields.render(options, '#button').then((handler) => {
            td.replace(handler, 'submit');
            td.when(handler.submit()).thenResolve();
            btn.click();
            td.verify(handler.submit());
        });
    });

    it('calls onAuthorize function with tokenization data if passed in', (done) => {
        let btn = document.createElement('button');
        let options = {
            payment:     td.function(),
            onAuthorize: td.function()
        };

        btn.id = 'button';
        if (document.body) {
            document.body.appendChild(btn);
        }

        client.HostedFields.render(options, '#button').then((handler) => {
            let tokenizationData = {
                foo: 'bar'
            };
            td.replace(handler, 'submit');
            td.when(handler.submit()).thenResolve(tokenizationData);
            btn.click();

            setTimeout(() => {
                td.verify(options.onAuthorize(tokenizationData));
                done();
            }, 100);
        }).catch(done);
    });

    it('calls onError function (if passed) when tokenization fails', (done) => {
        let btn = document.createElement('button');
        let options = {
            payment:     td.function(),
            onAuthorize: td.function(),
            onError:     td.function()
        };

        btn.id = 'button';
        if (document.body) {
            document.body.appendChild(btn);
        }

        client.HostedFields.render(options, '#button').then((handler) => {
            let error = new Error('error');
            td.replace(handler, 'submit');
            td.when(handler.submit()).thenReject(error);
            btn.click();

            setTimeout(() => {
                td.verify(options.onError(error));
                done();
            }, 100);
        }).catch(done);
    });

    it('does not require an onError function', (done) => {
        let btn = document.createElement('button');
        let options = {
            payment:     td.function(),
            onAuthorize: td.function()
        };

        btn.id = 'button';
        if (document.body) {
            document.body.appendChild(btn);
        }

        client.HostedFields.render(options, '#button').then((handler) => {
            let error = new Error('error');
            td.replace(handler, 'submit');
            td.when(handler.submit()).thenReject(error);
            btn.click();

            setTimeout(() => {
                done();
            }, 100);
        }).catch(done);
    });
});
