/* @flow */

import { getLogger, getClientToken, getCorrelationID, getPayPalAPIDomain } from 'paypal-braintree-web-client/src';
import { FPTI_KEY } from 'paypal-sdk-constants/src';
import { ZalgoPromise } from 'zalgo-promise/src';

// toodoo unvendor this when braintree-web is updated
import btClient from '../vendor/braintree-web/client';
import hostedFields from '../vendor/braintree-web/hosted-fields';

import contingencyFlow from './contingency-flow';
import type { HostedFieldsHandler } from './types';

let TESTING_CONFIGURATION = {
  assetsUrl: 'https://assets.braintreegateway.com',
  card:      {
    supportedCardBrands: [ 'VISA' ]
  }
};

function createSubmitHandler (hostedFieldsInstance, orderIdFunction) : Function {
  return (options = {}) => {
    const logger = getLogger();

    return orderIdFunction().then((orderId) => {
      return hostedFieldsInstance.tokenize({
        ...options,
        orderId
      }).catch((err) => {
        if (!(err.details && err.details.find && err.details.find(detail => detail.issue === 'CONTINGENCY'))) {
          return ZalgoPromise.reject(err);
        }

        let url = `${ err.links.find(link => link.rel === '3ds-contingency-resolution').href  }`;
        return contingencyFlow.start(url);
      }).then((payload) => {
        // does contingency flow give a payload?
        logger.track({
          comp:                                'hostedpayment',
          // risk_correlation_id: 'TODO',
          card_brand:                          payload && payload.payment_source && payload.payment_source.card.card_type,
          api_integration_type:                'PAYPALSDK',
          product_identifier:                  'PAYPAL_FOR_MARKETPLACES',
          [FPTI_KEY.STATE]:                    'CARD_PAYMENT_FORM',
          [FPTI_KEY.TRANSITION]:               'process_card_payment',
          hosted_payment_session_cre_dt:       (new Date()).toString(),
          hosted_payment_session_cre_ts_epoch: Date.now().toString()
        });

        return { orderId };
      });
    });
  };
}

type OptionsType = {
  createOrder : () => ZalgoPromise<string>,
  onApprove : ({ }) => void | ZalgoPromise<void>,
  onError? : (mixed) => void
};

export let HostedFields = {
  isEligible() : boolean {
    let cardConfig = __hosted_fields__.serverConfig.fundingEligibility.card;

    return cardConfig.eligible && !cardConfig.branded;
  },

  render(options : OptionsType, buttonSelector : string) : ZalgoPromise<HostedFieldsHandler> {
    const logger = getLogger();

    if (typeof options.createOrder !== 'function') {
      return ZalgoPromise.reject(new Error('createOrder parameter must be a function.'));
    }
    // toodoo - revert change below when config is being passed correctly
    let configuration = (typeof __hosted_fields__ !== 'undefined') ? __hosted_fields__.serverConfig : TESTING_CONFIGURATION;
    configuration.assetsUrl = TESTING_CONFIGURATION.assetsUrl;
    if (!configuration.card && configuration.paypalMerchantConfiguration && configuration.paypalMerchantConfiguration.creditCard) {
      configuration.card = configuration.paypalMerchantConfiguration.creditCard;
    } else {
      // configuration.card = TESTING_CONFIGURATION.card;
    }

    let clientToken = getClientToken();

    let correlationId = getCorrelationID();
    // $FlowFixMe
    configuration.correlationId = correlationId;
    // $FlowFixMe
    configuration.paypalApi = getPayPalAPIDomain();

    let orderIdFunction = () => {
      return ZalgoPromise.resolve().then(() => {
        return options.createOrder();
      });
    };
    let button;

    if (buttonSelector && options.onApprove) {
      button = document.querySelector(buttonSelector);
      if (!button) {
        return ZalgoPromise.reject(new Error(`Could not find selector \`${ buttonSelector }\` on the page`));
      }
    }

    let hostedFieldsCreateOptions = JSON.parse(JSON.stringify(options));

    return btClient.create({
      authorization: clientToken,
      paymentsSdk:   true,
      configuration
    }).then((btClientInstance) => {
      hostedFieldsCreateOptions.paymentsSdk = true;
      hostedFieldsCreateOptions.client = btClientInstance;
      return hostedFields.create(hostedFieldsCreateOptions);
    }).then((hostedFieldsInstance) => {
      hostedFieldsInstance.submit = createSubmitHandler(hostedFieldsInstance, orderIdFunction);

      if (button) {
        button.addEventListener('click', () => {
          hostedFieldsInstance.submit().then((payload) => {
            return options.onApprove(payload);
          }).catch((err) => {

            if (options.onError) {
              options.onError(err);
            }
          });
        });
      }

      logger.track({
        comp:                                'hostedpayment',
        // risk_correlation_id: 'TODO',
        api_integration_type:                'PAYPALSDK',
        product_identifier:                  'PAYPAL_FOR_MARKETPLACES',
        [FPTI_KEY.STATE]:                    'CARD_PAYMENT_FORM',
        [FPTI_KEY.TRANSITION]:               'collect_card_info',
        hosted_payment_textboxes_shown:      Object.keys(hostedFieldsCreateOptions.fields).join(':'),
        hosted_payment_session_cre_dt:       (new Date()).toString(),
        hosted_payment_session_cre_ts_epoch: Date.now().toString()
      });

      return hostedFieldsInstance;
    });
  }
};
