'use strict';

var assign = require('../lib/assign').assign;
var atob = require('../lib/vendor/polyfill').atob;

var apiUrls = {
  production: 'https://api.braintreegateway.com:443',
  sandbox: 'https://api.sandbox.braintreegateway.com:443'
};

function _isTokenizationKey(str) {
  return /^[a-zA-Z0-9]+_[a-zA-Z0-9]+_[a-zA-Z0-9_]+$/.test(str);
}

function _isUnifiedClientToken(clientToken) {
  return /3-paypal/.test(clientToken.version);
}

function _parseTokenizationKey(tokenizationKey) {
  var tokens = tokenizationKey.split('_');
  var environment = tokens[0];
  var merchantId = tokens.slice(2).join('_');

  return {
    merchantId: merchantId,
    environment: environment
  };
}

function _parseUnifiedClientToken(clientToken) {
  return {
    attrs: {
      configVersion: clientToken.version
    },
    paypal: clientToken.paypal
  };
}

function createAuthorizationData(authorization) {
  var parsedClientToken, parsedTokenizationKey;
  var data = {
    attrs: {},
    configUrl: ''
  };

  if (_isTokenizationKey(authorization)) {
    parsedTokenizationKey = _parseTokenizationKey(authorization);
    data.attrs.tokenizationKey = authorization;
    data.configUrl = apiUrls[parsedTokenizationKey.environment] + '/merchants/' + parsedTokenizationKey.merchantId + '/client_api/v1/configuration';
    data.type = 'TOKENIZATION_KEY';
  } else {
    parsedClientToken = JSON.parse(atob(authorization));

    if (_isUnifiedClientToken(parsedClientToken)) {
      data = assign(data, _parseUnifiedClientToken(parsedClientToken));
      data.type = 'UNIFIED_CLIENT_TOKEN';
    } else {
      data.type = 'CLIENT_TOKEN';
    }

    data.configUrl = parsedClientToken.configUrl;
    data.attrs.authorizationFingerprint = parsedClientToken.authorizationFingerprint;
  }

  return data;
}

module.exports = createAuthorizationData;
