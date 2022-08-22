'use strict';

/**
 * @module braintree-web/apple-pay
 * @description Accept Apple Pay on the Web. *This component is currently in beta and is subject to change.*
 */

var BraintreeError = require('../lib/braintree-error');
var ApplePay = require('./apple-pay');
var analytics = require('../lib/analytics');
var basicComponentVerification = require('../lib/basic-component-verification');
var errors = require('./errors');
var VERSION = "3.32.0-paypal-vault-v3-support";
var Promise = require('../lib/promise');
var wrapPromise = require('@braintree/wrap-promise');

/**
 * @static
 * @function create
 * @param {object} options Creation options:
 * @param {Client} options.client A {@link Client} instance.
 * @param {callback} [callback] The second argument, `data`, is the {@link ApplePay} instance. If no callback is provided, `create` returns a promise that resolves with the {@link ApplePay} instance.
 * @returns {Promise|void} Returns a promise if no callback is provided.
 */
function create(options) {
  return basicComponentVerification.verify({
    name: 'Apple Pay',
    client: options.client
  }).then(function () {
    if (!options.client.getConfiguration().gatewayConfiguration.applePayWeb) {
      return Promise.reject(new BraintreeError(errors.APPLE_PAY_NOT_ENABLED));
    }

    analytics.sendEvent(options.client, 'applepay.initialized');

    return new ApplePay(options);
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
