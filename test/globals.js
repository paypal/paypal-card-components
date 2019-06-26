/* @flow */

import { insertMockSDKScript } from '@paypal/sdk-client/src';
import { SDK_SETTINGS } from '@paypal/sdk-constants/src';

window.TEST_CARD_ELIGIBILITY = {
  eligible: true,
  branded:  false,

  vendors: {
    visa: {
      eligible: true
    },
    mastercard: {
      eligible: true
    },
    amex: {
      eligible: true
    },
    discover: {
      eligible: true
    },
    hiper: {
      eligible: false
    },
    elo: {
      eligible: false
    },
    jcb: {
      eligible: false
    }
  }
};

beforeEach(() => {
  const body = document.body;

  if (!body) {
    throw new Error('Document body not available');
  }

  body.innerHTML = '';

  insertMockSDKScript({
    attributes: {
      [ SDK_SETTINGS.CLIENT_TOKEN ]: 'TEST'
    }
  });
});
