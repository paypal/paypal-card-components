/* @flow */

import { getHost, getPath } from 'paypal-braintree-web-client/src';

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
  let body = document.body;

  if (!body) {
    throw new Error('Document body not available');
  }

  body.innerHTML = '';

  let script = document.createElement('script');
  let src =  `https://${ getHost() }${ getPath() }`;

  script.setAttribute('src', src);
  script.setAttribute('data-client-token', 'TEST');
  body.appendChild(script);
});
