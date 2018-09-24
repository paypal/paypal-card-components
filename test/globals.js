/* @flow */

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
