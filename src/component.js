/* @flow */

import { FPTI_KEY, getLogger, getClientToken, getCorrelationID } from 'paypal-braintree-web-client/src';

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
  return () => {
    const logger = getLogger();

    return orderIdFunction().then((orderId) => {
      return hostedFieldsInstance.tokenize({
        orderId
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.log('contingency error', err);
        if (!(err.details && err.details.find && err.details.find(detail => detail.issue === 'CONTINGENCY'))) {
          return Promise.reject(err);
        }

        let url = `${ err.links.find(link => link.rel === '3ds-contingency-resolution').href  }`;
        // eslint-disable-next-line no-console
        console.log('opening contingency url', url);
        return contingencyFlow.start(url);
      }).then((payload) => {
        logger.track({
          comp: 'hostedpayment',
          [FPTI_KEY.FEED]: 'hostedpayment',
          risk_correlation_id: getCorrelationID(),
          [FPTI_KEY.DATA_SOURCE]: 'checkout',
          card_brand: payload.payemnt_source.card.card_type,
          api_integration_type: 'PAYPALSDK',
          product_identifier: 'PAYPAL_FOR_MARKETPLACES',
          [FPTI_KEY.STATE]: 'CARD_PAYMENT_FORM',
          [FPTI_KEY.TRANSITION]: 'process_card_payment',
          hosted_payment_session_cre_dt: new Date(),
          hosted_payment_session_cre_ts_epoch: Date.now(),
          [FPTI_KEY.USER_AGENT]: window.navigator.userAgent,
        });

        return { orderId };
      });
    });
  };
}

type OptionsType = {
  createOrder : () => Promise<string>,
  onApprove : ({ }) => void | Promise<void>,
  onError? : (mixed) => void
};

export let HostedFields = {
  isEligible() : boolean {
    let cardConfig = __hosted_fields__.serverConfig.fundingEligibility.card;

    return cardConfig.eligible && !cardConfig.branded;
  },

  render(options : OptionsType, buttonSelector : string) : Promise<HostedFieldsHandler> {
    const logger = getLogger();

    // toodoo - revert change below when config is being passed correctly
    let configuration = (typeof __hosted_fields__ !== 'undefined') ? __hosted_fields__.serverConfig : TESTING_CONFIGURATION;
    configuration.assetsUrl = TESTING_CONFIGURATION.assetsUrl;
    if (!configuration.card && configuration.paypalMerchantConfiguration && configuration.paypalMerchantConfiguration.creditCard) {
      configuration.card = configuration.paypalMerchantConfiguration.creditCard;
    } else {
      // configuration.card = TESTING_CONFIGURATION.card;
    }
    console.log('Using config'); // eslint-disable-line no-console
    console.log(configuration); // eslint-disable-line no-console

    let clientToken = getClientToken();

    let correlationId = getCorrelationID();
    // $FlowFixMe
    configuration.correlationId = correlationId;

    let orderIdFunction = () => {
      return Promise.resolve().then(() => {
        return options.createOrder();
      });
    };
    let button;

    if (buttonSelector && options.onApprove) {
      button = document.querySelector(buttonSelector);
      if (!button) {
        return Promise.reject(new Error(`Could not find selector \`${ buttonSelector }\` on the page`));
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
        comp: 'hostedpayment',
        [FPTI_KEY.FEED]: 'hostedpayment',
        risk_correlation_id: getCorrelationID(),
        [FPTI_KEY.DATA_SOURCE]: 'checkout',
        api_integration_type: 'PAYPALSDK',
        product_identifier: 'PAYPAL_FOR_MARKETPLACES',
        [FPTI_KEY.STATE]: 'CARD_PAYMENT_FORM',
        [FPTI_KEY.TRANSITION]: 'collect_card_info',
        hosted_payment_textboxes_shown: Object.keys(hostedFieldsCreateOptions.fields).join(':'),
        hosted_payment_session_cre_dt: new Date(),
        hosted_payment_session_cre_ts_epoch: Date.now(),
        [FPTI_KEY.USER_AGENT]: window.navigator.userAgent,
      });

      return hostedFieldsInstance;
    });
  }
};
