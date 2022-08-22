'use strict';
/**
 * @module braintree-web/paypal
 * @description A component to integrate with PayPal.
 * @deprecated Use the {@link PayPalCheckout|PayPal Checkout component} instead.
 */

var analytics = require('../lib/analytics');
var basicComponentVerification = require('../lib/basic-component-verification');
var BraintreeError = require('../lib/braintree-error');
var errors = require('./shared/errors');
var PayPal = require('./external/paypal');
var VERSION = "3.32.0-paypal-vault-v3-support";
var wrapPromise = require('@braintree/wrap-promise');
var Promise = require('../lib/promise');

/**
 * @static
 * @function create
 * @param {object} options Creation options:
 * @param {Client} options.client A {@link Client} instance.
 * @param {callback} callback The second argument, `data`, is the {@link PayPal} instance.
 * @example
 * // We recomend creating your PayPal button with button.js
 * // For an example, see http://codepen.io/braintree/pen/LNKJWa
 * var paypalButton = document.querySelector('.paypal-button');
 *
 * braintree.client.create({
 *   authorization: CLIENT_AUTHORIZATION
 * }, function (clientErr, clientInstance) {
 *   if (clientErr) {
 *     console.error('Error creating client:', clientErr);
 *     return;
 *   }
 *
 *   braintree.paypal.create({
 *     client: clientInstance
 *   }, function (paypalErr, paypalInstance) {
 *     if (paypalErr) {
 *       console.error('Error creating PayPal:', paypalErr);
 *       return;
 *     }
 *
 *     paypalButton.removeAttribute('disabled');
 *
 *     // When the button is clicked, attempt to tokenize.
 *     paypalButton.addEventListener('click', function (event) {
 *       // Because tokenization opens a popup, this has to be called as a result of
 *       // customer action, like clicking a button. You cannot call this at any time.
 *       paypalInstance.tokenize({
 *         flow: 'vault'
 *         // For more tokenization options, see the full PayPal tokenization documentation
 *         // http://braintree.github.io/braintree-web/current/PayPal.html#tokenize
 *       }, function (tokenizeErr, payload) {
 *         if (tokenizeErr) {
 *           if (tokenizeErr.type !== 'CUSTOMER') {
 *             console.error('Error tokenizing:', tokenizeErr);
 *           }
 *           return;
 *         }
 *
 *         // Tokenization succeeded
 *         paypalButton.setAttribute('disabled', true);
 *         console.log('Got a nonce! You should submit this to your server.');
 *         console.log(payload.nonce);
 *       });
 *     }, false);
 *   });
 * });
 * @returns {Promise|void} Returns a promise if no callback is provided.
 */
function create(options) {
  return basicComponentVerification.verify({
    name: 'PayPal',
    client: options.client
  }).then(function () {
    var pp;
    var config = options.client.getConfiguration();

    if (config.gatewayConfiguration.paypalEnabled !== true) {
      return Promise.reject(new BraintreeError(errors.PAYPAL_NOT_ENABLED));
    }

    analytics.sendEvent(options.client, 'paypal.initialized');

    pp = new PayPal(options);

    return pp._initialize();
  });
}

/**
 * @static
 * @function isSupported
 * @description Returns true if PayPal [supports this browser](index.html#browser-support-webviews).
 * @example
 * if (braintree.paypal.isSupported()) {
 *   // Add PayPal button to the page
 * } else {
 *   // Hide PayPal payment option
 * }
 * @returns {Boolean} Returns true if PayPal supports this browser.
 */
function isSupported() {
  return true;
}

module.exports = {
  create: wrapPromise(create),
  isSupported: isSupported,
  /**
   * @description The current version of the SDK, i.e. `{@pkg version}`.
   * @type {string}
   */
  VERSION: VERSION
};
