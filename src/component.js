/* @flow */

import { getLogger, getClientToken, getCorrelationID, getPayPalAPIDomain, getVault, getMerchantID, getFundingEligibility, getGraphQLFundingEligibility, isChildWindow } from '@paypal/sdk-client/src';
import { FPTI_KEY } from '@paypal/sdk-constants/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { uniqueID } from 'belter/src';
import { destroy as zoidDestroy } from 'zoid/src';

// toodoo unvendor this when braintree-web is updated
import btClient from '../vendor/braintree-web/client';
import hostedFields from '../vendor/braintree-web/hosted-fields';

import contingencyFlow from './contingency-flow';
import type { HostedFieldsHandler } from './types';

const MSP_ENABLED = true;  // flag whether msp feature is enabled

const TESTING_CONFIGURATION = {
  assetsUrl: 'https://assets.braintreegateway.com',
  card:      {
    supportedCardBrands: [ 'VISA' ]
  }
};

const LIABILITYSHIFTED_MAPPER = {
  YES:      true,
  POSSIBLE: true,
  NO:       false
};

const uccEligibilityFields = `
  card {
      eligible
      branded
  }
`;

let hosted_payment_session_id = '';

let fundingEligibility = null;
let getUccEligibility = null;

function createSubmitHandler (hostedFieldsInstance, orderIdFunction) : Function {
  let paymentInProgress = false;

  return (options = {}) => {
    const logger = getLogger();

    if (paymentInProgress) {
      return ZalgoPromise.reject(new Error('Hosted Fields payment is already in progress.'));
    }

    if (!options.hasOwnProperty('vault')) {
      options.vault = getVault();
    }

    paymentInProgress = true;

    return orderIdFunction().then((orderId) => {
      logger.info('HOSTEDFIELDS_SUBMIT');
      logger.track({
        [ FPTI_KEY.STATE ]:              'CARD_PAYMENT_FORM',
        [ FPTI_KEY.TRANSITION ]:         'process_receive_order',
        hosted_payment_session_id,
        [ FPTI_KEY.CONTEXT_TYPE ]:       'Cart-ID',
        [ FPTI_KEY.CONTEXT_ID ]:         orderId
      });
      logger.flush();

      return hostedFieldsInstance.tokenize({
        ...options,
        orderId
      }).catch((err) => {
        if (!(err.details && err.details.find && err.details.find(detail => detail.issue === 'CONTINGENCY'))) {
          return ZalgoPromise.reject(err);
        }

        const url = `${ err.links.find(link => link.rel === '3ds-contingency-resolution').href  }`;

        logger.info('HOSTEDFIELDS_3DS');
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
        logger.flush();

        paymentInProgress = false;

        // keep this for backward compatible
        let liabilityShifted = payload.success;

        // map liability_shift (YES/NO/UNKNOWN) to liabilityShifted (true/false/undefined) for backward compatibility
        if (payload.liability_shift) {
          liabilityShifted = LIABILITYSHIFTED_MAPPER[payload.liability_shift];
        }

        return {
          liabilityShifted,
          liabilityShift:       payload.liability_shift,
          authenticationStatus: payload.status,
          authenticationReason: payload.authentication_status_reason,
          card:                 payload && payload.payment_source && payload.payment_source.card,
          orderId
        };
      }).catch((err) => {
        paymentInProgress = false;

        return ZalgoPromise.reject(err);
      });
    });
  };
}

type OptionsType = {|
  createOrder : () => ZalgoPromise<string>,
  onApprove : ({| |}) => void | ZalgoPromise<void>,
  onError? : (mixed) => void,
  fields? : {|
    number? : {|
      selector : string
    |}
  |}
|};

export const HostedFields = {
  isEligible() : boolean {
    const clientToken = getClientToken();

    if (!clientToken) {
      return false;
    }
    // check whether getFundingEligibility isFulfilled, otherwise, use the default;
    if (fundingEligibility && fundingEligibility.card) {
      return Boolean(fundingEligibility.card.eligible && !fundingEligibility.card.branded);
    }
    const cardConfig = __hosted_fields__.serverConfig.fundingEligibility.card;

    return cardConfig.eligible && !cardConfig.branded;
  },

  render(options : OptionsType, buttonSelector : string) : ZalgoPromise<HostedFieldsHandler> {
    const logger = getLogger();

    if (typeof options.createOrder !== 'function') {
      return ZalgoPromise.reject(new Error('createOrder parameter must be a function.'));
    }

    if (!getUccEligibility) {
      // this should not happened, just in case
      logger.warn(`FORCED_TO_CALL_GETGRAPHQLFUNDINGELIGIBILITY`);
      getUccEligibility = getGraphQLFundingEligibility(uccEligibilityFields);
    }

    return getUccEligibility.then((eligibilityData) => {
      if (!eligibilityData || !eligibilityData.card || !eligibilityData.card.eligible || eligibilityData.card.branded) {
        logger.warn('HOSTEDFIELDS_NOT_ELIGIBLE');
        // inEligible
        return ZalgoPromise.reject(new Error('hosted fields are not eligible.'));
      }
      // toodoo - revert change below when config is being passed correctly
      const configuration = (typeof __hosted_fields__ !== 'undefined') ? __hosted_fields__.serverConfig : TESTING_CONFIGURATION;

      configuration.assetsUrl = TESTING_CONFIGURATION.assetsUrl;

      const cardVendors = (configuration.fundingEligibility && configuration.fundingEligibility.card && configuration.fundingEligibility.card.vendors) || {};
      const eligibleCards = Object.keys(cardVendors).filter(key => cardVendors[key].eligible);

      const clientToken = getClientToken();

      const correlationId = getCorrelationID();

      // $FlowFixMe
      configuration.correlationId = correlationId;
      // $FlowFixMe
      configuration.paypalApi = getPayPalAPIDomain();

      const orderIdFunction = () => {
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

      const hostedFieldsCreateOptions = JSON.parse(JSON.stringify(options));

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
        hostedFieldsInstance.getCardTypes = () => {
          return __hosted_fields__.serverConfig.fundingEligibility.card.vendors;
        };

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
        logger.info('HOSTEDFIELDS_RENDERED');
        hosted_payment_session_id = uniqueID();
        logger.track({
          comp:                                 'hostedpayment',
          // risk_correlation_id: 'TODO',
          api_integration_type:                 'PAYPALSDK',
          [FPTI_KEY.STATE]:                     'CARD_PAYMENT_FORM',
          [FPTI_KEY.TRANSITION]:                'collect_card_info',
          hosted_payment_textboxes_shown:       Object.keys(hostedFieldsCreateOptions.fields).join(':'),
          hosted_payment_session_cre_dt:        (new Date()).toString(),
          hosted_payment_session_cre_ts_epoch:  Date.now().toString(),
          [FPTI_KEY.CONTEXT_TYPE]:              'hosted_session_id',
          [FPTI_KEY.CONTEXT_ID]:                hosted_payment_session_id,
          [FPTI_KEY.FUNDING_LIST]:              eligibleCards.join(':'),
          [FPTI_KEY.FUNDING_COUNT]:             eligibleCards.length.toString()
        });
        logger.flush();

        return hostedFieldsInstance;
      });
    });
  }
};

export function setupHostedFields() : Function {
  // not run inside zoid
  if (isChildWindow()) {
    return;
  }

  const merchantId = getMerchantID();
  const originalFundingEligibility = getFundingEligibility();

  // if msp, kick off eligibility call with multiple merchant ids to GQL
  if (MSP_ENABLED && merchantId && merchantId.length > 1) {
    getLogger().info('HOSTEDFIELDS_MSP_GETFUNDINGELIGIBILITY');
    getUccEligibility = getGraphQLFundingEligibility(uccEligibilityFields);
  } else {
    getUccEligibility = ZalgoPromise.resolve(originalFundingEligibility);
  }

  getUccEligibility.then((data) => {
    fundingEligibility = data;
  });

}

export function destroy() {
  zoidDestroy();
}
