'use strict';

/**
 * @module braintree-web/visa-checkout
 * @description Processes Visa Checkout. *This component is currently in beta and is subject to change.*
 */

var basicComponentVerification = require('../lib/basic-component-verification');
var BraintreeError = require('../lib/braintree-error');
var VisaCheckout = require('./visa-checkout');
var analytics = require('../lib/analytics');
var errors = require('./errors');
var VERSION = "3.32.0-paypal-vault-v3-support";
var Promise = require('../lib/promise');
var wrapPromise = require('@braintree/wrap-promise');

/**
 * @static
 * @function create
 * @param {object} options Creation options:
 * @param {Client} options.client A {@link Client} instance.
 * @param {callback} [callback] The second argument, `data`, is the {@link VisaCheckout} instance. If no callback is provided, `create` returns a promise that resolves with the {@link VisaCheckout} instance.
 * @returns {Promise|void} Returns a promise if no callback is provided.
 */
function create(options) {
  return basicComponentVerification.verify({
    name: 'Visa Checkout',
    client: options.client
  }).then(function () {
    if (!options.client.getConfiguration().gatewayConfiguration.visaCheckout) {
      return Promise.reject(new BraintreeError(errors.VISA_CHECKOUT_NOT_ENABLED));
    }

    analytics.sendEvent(options.client, 'visacheckout.initialized');

    return new VisaCheckout(options);
  });
}

module.exports = {
  create: wrapPromise(create),
  /**
   * @description The current version of the SDK, i.e. `{@pkg version}`.
   * @type {string}
   */
  VERSION: VERSION
};
