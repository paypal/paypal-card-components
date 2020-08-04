/* @flow */
/* eslint max-lines: off */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';
import { ZalgoPromise } from 'zalgo-promise/src';
import { insertMockSDKScript } from '@paypal/sdk-client/src';
import { SDK_QUERY_KEYS, QUERY_BOOL } from '@paypal/sdk-constants/src';

import btClient from '../vendor/braintree-web/client';
import hostedFields from '../vendor/braintree-web/hosted-fields';
import { HostedFields, setupHostedFields } from '../src/index';
import contingencyFlow from '../src/contingency-flow';
import type { InstallmentsConfiguration } from '../src/component';

import rejectIfResolves from './utils/reject-if-resolves';

describe('hosted-fields-component', () => {
  let btClientCreate;
  let contingencyFlowStart;
  let fakeBtClient;
  let fakeHostedFieldsInstance;
  let hostedFieldsCreate;
  let renderOptions;
  let fakeTokenizationPayload;

  beforeEach(() => {
    setupHostedFields();
    renderOptions = {
      createOrder: () => ZalgoPromise.resolve('order-id'),
      onApprove:   td.function(),
      onError:     td.function(),
      fields:      {
        number: {
          selector: '#credit-card'
        }
      }
    };

    fakeTokenizationPayload = {
      payment_source: {
        card: {
          last_digits: '1111',
          card_type:   'VISA'
        }
      },
      links: []
    };
    btClientCreate = td.replace(btClient, 'create');
    contingencyFlowStart = td.replace(contingencyFlow, 'start');

    fakeHostedFieldsInstance = td.object([ 'tokenize' ]);
    td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object))).thenResolve(fakeTokenizationPayload);
    hostedFieldsCreate = td.replace(hostedFields, 'create');

    fakeBtClient = {
      getConfiguration: (conf) => conf
    };

    td.when(hostedFieldsCreate(td.matchers.isA(Object))).thenResolve(fakeHostedFieldsInstance);
    td.when(btClientCreate(td.matchers.isA(Object))).thenResolve(fakeBtClient);

    const button = document.createElement('button');
    button.id = 'button';

    // $FlowFixMe
    document.body.appendChild(button);
  });

  afterEach(() => {
    window.TEST_CARD_ELIGIBILITY.eligible = true;
    window.TEST_CARD_ELIGIBILITY.branded = false;
    td.reset();
  });

  describe('isEligible', () => {
    it('returns true when card is eligible and not branded', () => {
      window.TEST_CARD_ELIGIBILITY.eligible = true;
      window.TEST_CARD_ELIGIBILITY.branded = false;
      assert.equal(HostedFields.isEligible(), true);
    });

    // can't reassign these variables in tests
    it('returns false when card is not eligible', () => {
      window.TEST_CARD_ELIGIBILITY.eligible = false;
      assert.equal(HostedFields.isEligible(), false);
    });

    it('returns false when card is eligible but branded', () => {
      window.TEST_CARD_ELIGIBILITY.eligible = true;
      window.TEST_CARD_ELIGIBILITY.branded = true;
      assert.equal(HostedFields.isEligible(), false);
    });
  });

  it('rejects if no payments function is provided', () => {
    delete renderOptions.createOrder;

    return HostedFields.render(renderOptions, '#button').then(rejectIfResolves).catch((err) => {
      // $FlowFixMe
      assert.equal(err.message, 'createOrder parameter must be a function.');
    });
  });

  it('rejects with an error if braintree-web.client errors out', () => {
    const error = new Error('Some BT Web client Error');

    td.when(btClientCreate(td.matchers.isA(Object))).thenReject(error);

    return HostedFields.render(renderOptions, '#button').then(rejectIfResolves).catch((err) => {
      td.verify(hostedFieldsCreate(td.matchers.anything()), {
        times: 0
      });

      assert.equal(err, error);
    });
  });

  it('rejects if installments object is passed but no onInstallmentsRequested function is passed', () => {
    const options = {
      ...renderOptions,
      installments: {
        // eslint-disable-next-line no-unused-vars
        onInstallmentsAvailable(installments) : void {
          // render installments on page here
        }
      }
    };

    // $FlowFixMe
    return HostedFields.render(options, '#button')
      .then(rejectIfResolves)
      .catch(err => {
        // $FlowFixMe
        assert.equal(err.message, 'installments must include both onInstallmentsRequested and onInstallmentsAvailable functions');
      });
  });

  it('rejects if installments object is passed but no onInstallmentsAvailable function is passed', () => {
    const options = {
      ...renderOptions,
      installments: {
        onInstallmentsRequested() : InstallmentsConfiguration {
          return {
            financingCountryCode: 'ABC',
            currencyCode:         'ABC',
            billingCountryCode:   'ABC',
            amount:               '100.00'
          };
        }
      }
    };

    // $FlowFixMe
    return HostedFields.render(options, '#button')
      .then(rejectIfResolves)
      .catch(err => {
        // $FlowFixMe
        assert.equal(err.message, 'installments must include both onInstallmentsRequested and onInstallmentsAvailable functions');
      });
  });

  it('rejects with an error if braintree-web.hosted-fields errors out', () => {
    const error = new Error('Some BT Web Error');

    td.when(hostedFieldsCreate(td.matchers.isA(Object))).thenReject(error);

    return HostedFields.render(renderOptions, '#button').then(rejectIfResolves).catch((err) => {
      assert.equal(err, error);
    });
  });

  it('should create a Braintree client and Hosted Fields instance with configuration', () => {
    return HostedFields.render(renderOptions, '#button').then(() => {
      td.verify(btClientCreate({
        authorization: 'TEST',
        paymentsSdk:   true,
        configuration: td.matchers.isA(Object)
      }));
      td.verify(hostedFieldsCreate({
        client:      fakeBtClient,
        paymentsSdk: true,
        fields:      {
          number: {
            selector: '#credit-card'
          }
        }
      }));
    });
  });

  it('resolves with an object that can tokenize', () => {
    return HostedFields.render(renderOptions, '#button').then((handler) => {
      return handler.submit();
    }).then(() => {
      td.verify(fakeHostedFieldsInstance.tokenize({
        vault:   false,
        orderId: 'order-id'
      }));
    });
  });

  it('defaults vault param to the value of getVault when true from @paypal/client-sdk when submitting', () => {
    insertMockSDKScript({
      query: {
        [ SDK_QUERY_KEYS.VAULT ]: QUERY_BOOL.TRUE
      }
    });

    return HostedFields.render(renderOptions, '#button').then((handler) => {
      return handler.submit();
    }).then(() => {
      td.verify(fakeHostedFieldsInstance.tokenize({
        vault:   true,
        orderId: 'order-id'
      }));
    });
  });

  it('defaults vault param to the value of getVault when false from @paypal/client-sdk when submitting', () => {
    insertMockSDKScript({
      query: {
        [SDK_QUERY_KEYS.VAULT]: QUERY_BOOL.FALSE
      }
    });

    return HostedFields.render(renderOptions, '#button').then((handler) => {
      return handler.submit();
    }).then(() => {
      td.verify(fakeHostedFieldsInstance.tokenize({
        vault:   false,
        orderId: 'order-id'
      }));
    });
  });

  it('can overwrite default vault property when submitting', () => {
    return HostedFields.render(renderOptions, '#button').then((handler) => {
      return handler.submit({
        vault: true
      });
    }).then(() => {
      td.verify(fakeHostedFieldsInstance.tokenize({
        vault:   true,
        orderId: 'order-id'
      }));
    });
  });

  it('resolves with an object that can tokenize with additional options', () => {
    return HostedFields.render(renderOptions, '#button').then((handler) => {
      return handler.submit({
        billingAddress: {
          postalCode: '60654'
        }
      });
    }).then(() => {
      td.verify(fakeHostedFieldsInstance.tokenize({
        vault:          false,
        orderId:        'order-id',
        billingAddress: {
          postalCode: '60654'
        }
      }));
    });
  });

  it('resolves with a hosted fields instance', () => {
    return HostedFields.render(renderOptions, '#button').then((handler) => {
      assert.equal(handler, fakeHostedFieldsInstance);
    });
  });

  it('can setup click handler for provided button if onApprove function is passed', () => {
    const btn = document.createElement('button');

    btn.id = 'button2';
    if (document.body) {
      document.body.appendChild(btn);
    }

    td.replace(btn, 'addEventListener');

    return HostedFields.render(renderOptions, '#button2').then(() => {
      td.verify(btn.addEventListener('click', td.matchers.isA(Function)));
    });
  });

  it('rejects render with an error if button element cannot be found', () => {
    return HostedFields.render(renderOptions, '#button2').then(rejectIfResolves).catch((err) => {
      // $FlowFixMe
      assert.equal(err.message, 'Could not find selector `#button2` on the page');
    });
  });

  it('calls submit when btn is clicked', () => {
    const btn = document.createElement('button');

    btn.id = 'button2';
    if (document.body) {
      document.body.appendChild(btn);
    }

    return HostedFields.render(renderOptions, '#button2').then((handler) => {
      td.replace(handler, 'submit');
      td.when(handler.submit()).thenResolve();
      btn.click();
      td.verify(handler.submit());
    });
  });

  it('calls onApprove function with tokenization data if passed in', (done) => {
    const btn = document.createElement('button');

    btn.id = 'button2';
    if (document.body) {
      document.body.appendChild(btn);
    }

    HostedFields.render(renderOptions, '#button2').then((handler) => {
      const tokenizationData = {
        foo: 'bar'
      };
      td.replace(handler, 'submit');
      td.when(handler.submit()).thenResolve(tokenizationData);
      btn.click();

      setTimeout(() => {
        td.verify(renderOptions.onApprove(tokenizationData));
        done();
      }, 100);
    }).catch(done);
  });

  it('calls onError function (if passed) when tokenization fails', (done) => {
    const btn = document.createElement('button');

    btn.id = 'button2';
    if (document.body) {
      document.body.appendChild(btn);
    }

    HostedFields.render(renderOptions, '#button2').then((handler) => {
      const error = new Error('error');
      td.replace(handler, 'submit');
      td.when(handler.submit()).thenReject(error);
      btn.click();

      setTimeout(() => {
        td.verify(renderOptions.onError(error));
        done();
      }, 100);
    }).catch(done);
  });

  it('does not require an onError function', (done) => {
    const btn = document.createElement('button');

    btn.id = 'button2';
    if (document.body) {
      document.body.appendChild(btn);
    }

    HostedFields.render(renderOptions, '#button2').then((handler) => {
      const error = new Error('error');
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
    const orderId = 'im-order-id';

    beforeEach(() => {
      button = document.createElement('button');
      button.id = 'button';
      renderOptions.createOrder = td.function();


      if (document.body) {
        document.body.appendChild(button);
      }

      td.when(renderOptions.createOrder()).thenReturn(orderId);
    });

    it('passes back order id', () => {
      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then((actual) => {
          assert.equal(orderId, actual.orderId);
        });
      });
    });

    it('rejects if an order is already in progress', () => {
      return HostedFields.render(renderOptions, '#button').then((handler) => {
        td.replace(fakeHostedFieldsInstance, 'tokenize', () => {
          return new ZalgoPromise(() => {
            // do not resolve
          });
        });

        handler.submit(); // start a request that never resolves

        return handler.submit().then(rejectIfResolves).catch((err) => {
          // $FlowFixMe
          assert.equal(err.message, 'Hosted Fields payment is already in progress.');
        });
      });
    });

    it('rejects with an error if the error does not have a details object', () => {
      const expectedError = new Error('something bad happened');

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('rejects with an error if the error\'s detail key is not an array indicating not a 3ds contingency', () => {
      const expectedError = {
        details: 'its pretty baad'
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('rejects with an error if the error has a details array, but is not a 3ds contingency', () => {
      const expectedError = {
        details: [
          'its pretty baad'
        ]
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(expectedError);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch((err) => {
          assert.equal(expectedError, err);
        });
      });
    });

    it('runs through contingency flow if error is 3ds contingency and resolves if contingency resolves', () => {
      const expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      const error = {
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
      const threeDSResult = {
        success: true
      };

      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(error);

      td.when(contingencyFlow.start(expectedUrl)).thenResolve(threeDSResult);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then((actual) => {
          td.verify(contingencyFlowStart(expectedUrl));
          assert.equal(actual.liabilityShifted, true);
        });
      });
    });

    it('runs through contingency flow if error is 3ds contingency and rejects if contingency rejects', () => {
      const expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      const error = {
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

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then(rejectIfResolves).catch(() => {
          td.verify(contingencyFlowStart(expectedUrl));
        });
      });
    });

    it('resolve 3ds contingency and return liabilityShifted true if liability_shifted is YES', () => {
      const expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      const error = {
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
      const threeDSResult = {
        success:                      true,
        liability_shift:              'YES',
        status:                       'YES',
        authentication_status_reason: 'UNAVAILABLE'
      };


      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(error);

      td.when(contingencyFlow.start(expectedUrl)).thenResolve(threeDSResult);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then((actual) => {
          td.verify(contingencyFlowStart(expectedUrl));
          assert.equal(actual.liabilityShifted, true);
          assert.equal(actual.authenticationStatus, threeDSResult.status);
          assert.equal(actual.authenticationReason, threeDSResult.authentication_status_reason);
        });
      });
    });

    it('resolve 3ds contingency and return liabilityShifted false if liability_shifted is NO', () => {
      const expectedUrl = 'https://www.paypal.com/webapps/helios?action=resolve&flow=3ds&cart_id=21E005655U660730L';
      const error = {
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
      const threeDSResult = {
        success:                      true,
        liability_shift:              'NO',
        status:                       'YES',
        authentication_status_reason: 'UNAVAILABLE'
      };


      td.when(fakeHostedFieldsInstance.tokenize(td.matchers.isA(Object)))
        .thenReject(error);

      td.when(contingencyFlow.start(expectedUrl)).thenResolve(threeDSResult);

      return HostedFields.render(renderOptions, '#button').then((handler) => {
        return handler.submit().then((actual) => {
          td.verify(contingencyFlowStart(expectedUrl));
          assert.equal(actual.liabilityShifted, false);
          assert.equal(actual.authenticationStatus, threeDSResult.status);
          assert.equal(actual.authenticationReason, threeDSResult.authentication_status_reason);
        });
      });
    });
  });

  describe('#getCardTypes', () => {
    it('returns eligble card types', () => {
      return HostedFields.render(renderOptions, '#button').then((hf) => {
        const cards = hf.getCardTypes();

        assert.equal(cards.visa.eligible, true);
        assert.equal(cards.mastercard.eligible, true);
        assert.equal(cards.elo.eligible, false);
        assert.equal(cards.jcb.eligible, false);
      });
    });
  });
});
