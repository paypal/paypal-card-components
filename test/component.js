/* @flow */

import '../src/index';
import assert from 'assert';

import btClient from 'braintree-web/client';
import hostedFields from 'braintree-web/hosted-fields';
import td from 'testdouble/dist/testdouble';

import contingencyFlow from '../src/contingency-flow';

import rejectIfResolves from './utils/reject-if-resolves';

describe('hosted-fields-component', () => {
  let btClientCreate;
  let contingencyFlowStart;
  let client;
  let fakeBtClient;
  let fakeHostedFieldsInstance;
  let hostedFieldsCreate;
  let renderOptions;

  beforeEach(() => {
    client = window.paypal.client({
      env:  'production',
      auth: {
        test: 'TEST'
      }
    });
    renderOptions = {
      payment: () => 'order-id'
    };
    btClientCreate = td.replace(btClient, 'create');
    contingencyFlowStart = td.replace(contingencyFlow, 'start');

    fakeHostedFieldsInstance = td.object([ 'tokenize' ]);
    td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object))).thenResolve();
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
        authorization: 'TEST',
        paymentsSdk:   true,
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

  describe('#submit', () => {
    let button;
    let orderId = 'im-order-id';
    let options = {
      payment:     td.function(),
      onAuthorize: td.function()
    };

    beforeEach(() => {
      button = document.createElement('button');
      button.id = 'button';

      if (document.body) {
        document.body.appendChild(button);
      }

      td.when(options.payment()).thenReturn(orderId);
    });

    it('passes back order id', () => {
      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then((actual) => {
          assert.equal(orderId, actual.orderId);
        });
      });
    });

    it('rejects with an error if the error does not have a details object', () => {
      let expectedError = new Error('something bad happened');

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('rejects with an error if the error\'s detail key is not an array indicating not a 3ds contingency', () => {
      let expectedError = {
        details: 'its pretty baad'
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('rejects with an error if the error has a details array, but is not a 3ds contingency', () => {
      let expectedError = {
        details: [
          'its pretty baad'
        ]
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('runs through contingency flow if error is 3ds contingency and resolves if contingency resolves', () => {
      let expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      let error = {
        name:    'UNPROCESSABLE_ENTITY',
        message: 'The requested action could not be performed, semantically incorrect, or failed business validation.',
        details: [
          {
            issue:       'CONTINGENCY',
            description: 'Buyer needs to resolve following contingency before proceeding with payment'
          }
        ],
        links: [
          {
            href:    expectedUrl,
            rel:    '3ds-contingency-resolution',
            method: 'GET'
          },
          {
            rel:    'information_link',
            href:   'https://developer.paypal.com/docs/api/errors/#contingency',
            method: 'GET'
          },
          {
            rel:    'cancel',
            href:   'https://api.paypal.com/v1/checkout/orders/21E005655U660730L',
            method: 'DELETE'
          }
        ]
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(error);

      td.when(contingencyFlow.start(expectedUrl)).thenResolve();

      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then(() => {
          td.verify(contingencyFlowStart(expectedUrl));
        });
      });
    });

    it('runs through contingency flow if error is 3ds contingency and rejects if contingency rejects', () => {
      let expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      let error = {
        name:    'UNPROCESSABLE_ENTITY',
        message: 'The requested action could not be performed, semantically incorrect, or failed business validation.',
        details: [
          {
            issue:       'CONTINGENCY',
            description: 'Buyer needs to resolve following contingency before proceeding with payment'
          }
        ],
        links: [
          {
            href:    expectedUrl,
            rel:    '3ds-contingency-resolution',
            method: 'GET'
          },
          {
            rel:    'information_link',
            href:   'https://developer.paypal.com/docs/api/errors/#contingency',
            method: 'GET'
          },
          {
            rel:    'cancel',
            href:   'https://api.paypal.com/v1/checkout/orders/21E005655U660730L',
            method: 'DELETE'
          }
        ]
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(error);

      td.when(contingencyFlow.start(expectedUrl)).thenReject();

      return client.HostedFields.render(options, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch(() => {
          td.verify(contingencyFlowStart(expectedUrl));
        });
      });
    });
  });
});
