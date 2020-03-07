/* @flow */
/* eslint import/no-default-export: off */

import { getLogger, getClientID, getBuyerCountry, getCurrency, getMerchantID, getDisableFunding, getDisableCard, getIntent, getCommit, getVault } from '@paypal/sdk-client/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { request } from 'belter/src';

const GRAPHQL_URI = '/graphql';

function callGraphQL<T>({ query, variables = {}, headers = {} } : { query : string, variables? : { [string] : mixed }, headers? : { [string] : string } }) : ZalgoPromise<T> {
  return request({
    url:     GRAPHQL_URI,
    method:  'POST',
    json:    {
      query,
      variables
    },
    headers: {
      'x-app-name': 'hosted_fields',
      ...headers
    }
  }).then(({ status, body }) => {
    const errors = body.errors || [];

    if (errors.length) {
      const message = errors[0].message || JSON.stringify(errors[0]);
      throw new Error(message);
    }

    if (status !== 200) {
      throw new Error(`${ GRAPHQL_URI } returned status ${ status }`);
    }

    return body.data;
  });
}

type CardVendorEligibility = {|
  eligible? : ?boolean,
  vaultable? : ?boolean
|};

type VendorEligibility = {|
  visa? : ?CardVendorEligibility,
  mastercard? : ?CardVendorEligibility,
  amex : ?CardVendorEligibility,
  discover? : ?CardVendorEligibility,
  hiper? : ?CardVendorEligibility,
  elo? : ?CardVendorEligibility,
  jcb? : ?CardVendorEligibility,
  cup? : ?CardVendorEligibility
|};

type FundingEligibility = {|
  card? : ?{
    eligible? : ?boolean,
    branded? : ?boolean,
    vendors? : ?VendorEligibility
  }
|};

function getFundingEligibility() : ZalgoPromise<FundingEligibility> {
  const merchantID = getMerchantID();

  if (merchantID && merchantID.length > 1) {
    // msp -> call gql with multiple merchant ids to get fundingEligibility
    const clientID = getClientID();
    const buyerCountry = getBuyerCountry();
    const currency = getCurrency();
    const intent = getIntent();
    const commit = getCommit();
    const vault = getVault();
    const disableFunding = getDisableFunding();
    const disableCard = getDisableCard();
    const variables = {
      clientID,
      buyerCountry,
      currency,
      intent,
      commit,
      vault,
      merchantID,
      disableFunding,
      disableCard
    };
    try {
      return callGraphQL({
        query: `
          query GetFundingEligibility(
            $clientID:String,
            $merchantID:[ String ],
            $buyerCountry:CountryCodes,
            $currency:SupportedCountryCurrencies,
            $intent:FundingEligibilityIntent,
            $commit:Boolean,
            $vault:Boolean,
            $disableFunding:[ SupportedPaymentMethodsType ],
            $disableCard:[ SupportedCardsType ]
          ) {
            fundingEligibility(
              clientId:$clientID,
              buyerCountry:$buyerCountry,
              currency:$currency,
              intent:$intent,
              commit:$commit,
              vault:$vault,
              disableFunding:$disableFunding,
              disableCard:$disableCard,
              merchantId:$merchantID
            ) {
                card{
                  eligible 
                  branded 
                  vendors{
                    visa{eligible vaultable}
                    mastercard{eligible vaultable}
                    amex{eligible vaultable}
                    discover{eligible vaultable}
                    hiper{eligible vaultable}
                    elo{eligible vaultable}
                    jcb{eligible vaultable}
                  }
              }
            }
          }
        `,
        variables
      }).then((gqlResult) => {
        if (!gqlResult || !gqlResult.fundingEligibility) {
          throw new Error(`GraphQL fundingEligibility returned no fundingEligibility object`);
        }
        return gqlResult && gqlResult.fundingEligibility;
      });
    }
    catch (err) {
      getLogger().error(`GraphQL fundingEligibility error`, err);
      return ZalgoPromise.reject(err);
    }
  }
  
  // return default
  return ZalgoPromise.resolve(__hosted_fields__.serverConfig.fundingEligibility);
}

export default {
  getFundingEligibility
};
