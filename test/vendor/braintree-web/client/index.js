/* @flow */

import assert from 'assert';
import td from 'testdouble/dist/testdouble';

import rejectIfResolves from '../../../utils/reject-if-resolves';
import btClient from '../../../../vendor/braintree-web/client';

let btClientOptions;

describe('braintree-web-client', () => {

  beforeEach(() => {
    btClientOptions = {
      authorization: 'eyJicmFpbnRyZWUiOiB7ImF1dGhvcml6YXRpb25GaW5nZXJwcmludCI6ICJ0ZXN0IiwgInZlcnNpb24iOiAiMSJ9LCAicGF5cGFsIjogeyJhY2Nlc3NUb2tlbiI6ICJ0ZXN0In0gfQ==',
      paymentsSdk:   true,
      configuration: {
        'correlationId': '123',
        'paypalApi': 'https://www.paypal.com',
        'assetsUrl': 'https://assets.braintreegateway.com'
      }
    };
  });

  afterEach(() => {
    td.reset();
  });


  it('rejects with an error if no authorization is provided', () => {

    delete btClientOptions.authorization;

    return btClient.create(btClientOptions).then(rejectIfResolves).catch((err) => {
      assert.equal(err.message, 'options.authorization is required when instantiating a client.');
    });
  });

  it('rejects with an error if the decrypted auth does not contain paypal.accessToken', () => {
    btClientOptions.authorization = 'badstring';

    return btClient.create(btClientOptions).then(rejectIfResolves).catch((err) => {
      assert.equal(err.message, 'Authorization is invalid. Make sure your client token or tokenization key is valid.');
    });
  });
});
