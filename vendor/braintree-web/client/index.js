'use strict';

var BraintreeError = require('../lib/braintree-error');
var Client = require('./client');
var getConfiguration = require('./get-configuration').getConfiguration;
var VERSION = "3.32.0-payments-sdk-dev";
var Promise = require('../lib/promise');
var wrapPromise = require('@braintree/wrap-promise');
var sharedErrors = require('../lib/errors');

var cachedClients = {};

/** @module braintree-web/client */

/**
 * @function create
 * @description This function is the entry point for the <code>braintree.client</code> module. It is used for creating {@link Client} instances that service communication to Braintree servers.
 * @param {object} options Object containing all {@link Client} options:
 * @param {string} options.authorization A tokenizationKey or clientToken.
 * @param {callback} [callback] The second argument, <code>data</code>, is the {@link Client} instance.
 * @returns {Promise|void} Returns a promise if no callback is provided.
 * @example
 * var createClient = require('braintree-web/client').create;
 *
 * createClient({
 *   authorization: CLIENT_AUTHORIZATION
 * }, function (createErr, clientInstance) {
 *   // ...
 * });
 * @static
 */
function create(options) {
  var configPromise;

  if (!options.authorization) {
    return Promise.reject(new BraintreeError({
      type: sharedErrors.INSTANTIATION_OPTION_REQUIRED.type,
      code: sharedErrors.INSTANTIATION_OPTION_REQUIRED.code,
      message: 'options.authorization is required when instantiating a client.'
    }));
  }

  if (cachedClients[options.authorization]) {
    return Promise.resolve(cachedClients[options.authorization]);
  }

  if (options.paymentsSdk && options.configuration) {
    configPromise = transformPaymentsSDKConfiguration(options.configuration, options.authorization);
  } else {
    configPromise = getConfiguration(options);
  }

  return configPromise.then(function (configuration) {
    var client;

    if (options.debug) {
      configuration.isDebug = true;
    }

    client = new Client(configuration);

    cachedClients[options.authorization] = client;

    return client;
  });
}

function transformPaymentsSDKConfiguration(config, auth) {
  auth = new Buffer(auth, 'base64');
  auth = JSON.parse(auth.toString('utf8'));

  // TODO which of these fields do we need
  return Promise.resolve({
    analyticsMetadata: 'todo_analytics_metadata_needs_to_be_set',
    authorization: 'sandbox_f252zhq7_hh4cpc39zq4rgjcg',
    authorizationType: 'TOKENIZATION_KEY',
    gatewayConfiguration: {
      paypalApi: {
        baseUrl: 'https://api.test25.stage.paypal.com', // TODO where to get this baseUrl from
        accessToken: auth.paypal.accessToken
      },
      assetsUrl: config.assetsUrl,
      analytics: {
        url: 'https://example.com/TODO'
      },
      creditCards: {
        supportedCardTypes: config.card.supportedCardBrands,
        supportedGateways: [{
          name: 'paypalApi'
        }]
      }
    }
  });
}

// Primarily used for testing the client create call
function clearCache() {
  cachedClients = {};
}

module.exports = {
  create: wrapPromise(create),
  /**
   * @description The current version of the SDK, i.e. `{@pkg version}`.
   * @type {string}
   */
  VERSION: VERSION,
  _clearCache: clearCache
};
