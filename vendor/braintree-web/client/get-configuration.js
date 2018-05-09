'use strict';

var assign = require('../lib/assign').assign;
var BraintreeError = require('../lib/braintree-error');
var Promise = require('../lib/promise');
var wrapPromise = require('@braintree/wrap-promise');
var request = require('./request');
var uuid = require('../lib/vendor/uuid');
var constants = require('../lib/constants');
var createAuthorizationData = require('../lib/create-authorization-data');
var errors = require('./errors');

function shapePayPalConfiguration(configuration) {
  var supportedCardTypes = configuration.gatewayConfiguration.credit_card_types;

  return {
    paypalApi: configuration.paypalApi,
    creditCards: {
      supportedCardTypes: supportedCardTypes
    }
  };
}

function getConfiguration(options) {
  return new Promise(function (resolve, reject) {
    var authData;
    var configOptions = {
      authorization: options.authorization
    };

    try {
      authData = createAuthorizationData(options.authorization);
    } catch (err) {
      reject(new BraintreeError(errors.CLIENT_INVALID_AUTHORIZATION));

      return;
    }

    configOptions.authData = authData;

    if (authData.type === 'UNIFIED_CLIENT_TOKEN') {
      resolve(getPayPalConfiguration(configOptions));
    } else {
      configOptions.configVersion = '3';
      resolve(getBraintreeConfiguration(configOptions));
    }
  });
}

function getBraintreeConfiguration(options) {
  var attrs = options.authData.attrs;
  var configUrl = options.authData.configUrl;
  var sessionId = uuid();
  var analyticsMetadata = {
    merchantAppId: global.location.host,
    platform: constants.PLATFORM,
    sdkVersion: constants.VERSION,
    source: constants.SOURCE,
    integration: constants.INTEGRATION,
    integrationType: constants.INTEGRATION,
    sessionId: sessionId
  };

  return new Promise(function (resolve, reject) {
    attrs._meta = analyticsMetadata;
    attrs.braintreeLibraryVersion = constants.BRAINTREE_LIBRARY_VERSION;
    attrs.configVersion = options.configVersion;

    request({
      url: configUrl,
      method: 'GET',
      data: attrs
    }, function (err, response, status) {
      var errorTemplate;

      if (err) {
        if (status === 403) {
          errorTemplate = errors.CLIENT_AUTHORIZATION_INSUFFICIENT;
        } else {
          errorTemplate = errors.CLIENT_GATEWAY_NETWORK;
        }

        reject(new BraintreeError({
          type: errorTemplate.type,
          code: errorTemplate.code,
          message: errorTemplate.message,
          details: {
            originalError: err
          }
        }));

        return;
      }

      resolve({
        authorization: options.authorization,
        analyticsMetadata: analyticsMetadata,
        authorizationType: options.authData.type,
        gatewayConfiguration: response
      });
    });
  });
}

function getPayPalConfiguration(options) {
  var attrs = options.authData.attrs;
  var paypalApi = {
    baseUrl: 'https://mapi.paypalcorp.com', // TODO where to get this baseUrl from.
    accessToken: options.authData.paypal.accessToken
  };

  return new Promise(function (resolve, reject) {
    var braintreeRequestPromise, paypalRequestPromise;

    options.configVersion = attrs.configVersion;
    braintreeRequestPromise = getBraintreeConfiguration(options);

    paypalRequestPromise = new Promise(function (res, rej) {
      request({
        url: options.authData.paypal.configUrl,
        method: 'GET',
        data: {
        },
        headers: {
          Authorization: 'Bearer ' + options.authData.paypal.accessToken,
          'Braintree-SDK-Version': constants.VERSION
        }
      }, function (err, response) {
        if (err) {
          rej(new BraintreeError({
            type: errors.CLIENT_GATEWAY_NETWORK.type,
            code: errors.CLIENT_GATEWAY_NETWORK.code,
            message: errors.CLIENT_GATEWAY_NETWORK.message,
            details: {originalError: err}
          }));

          return;
        }

        res({
          paypalApi: paypalApi,
          gatewayConfiguration: response
        });
      });
    }).then(shapePayPalConfiguration);

    Promise.all([braintreeRequestPromise, paypalRequestPromise]).then(function (response) {
      var braintreeResponse = response[0];
      var paypalResponse = response[1];

      braintreeResponse.gatewayConfiguration = assign({}, braintreeResponse.gatewayConfiguration, paypalResponse);

      resolve(braintreeResponse);
    }).catch(reject);
  });
}

module.exports = {
  getConfiguration: wrapPromise(getConfiguration)
};
