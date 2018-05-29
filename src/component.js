/* @flow */

import { attach } from 'paypal-braintree-web-client/src';

// toodoo unvendor this when braintree-web is updated
import btClient from '../vendor/braintree-web/client';
import hostedFields from '../vendor/braintree-web/hosted-fields';

import contingencyFlow from './contingency-flow';
import type { HostedFieldsHandler } from './types';

let TESTING_CONFIGURATION = {
  assetsUrl: 'https://payments-sdk-demo-assets.herokuapp.com',
  card:      {
    supportedCardBrands: [ 'VISA' ]
  }
};

function createSubmitHandler (hostedFieldsInstance, orderIdFunction) : Function {
  return () => {
    return orderIdFunction().then((orderId) => {
      return hostedFieldsInstance.tokenize({
        orderId
      }).catch((err) => {
        console.log('contingency error', err);
        if (!(err.details && err.details.find && err.details.find(detail => detail.issue === 'CONTINGENCY'))) {
          return Promise.reject(err);
        }

        let url = err.links.find(link => link.rel === '3ds-contingency-resolution').href;

        console.log('opening contingency url', url);
        return contingencyFlow.start(url);
      }).then(() => {
        return { orderId };
      });
    });
  };
}

attach('hosted-fields', ({ clientOptions }) => {
  let { auth } = clientOptions;

  // toodoo - revert change below when config is being passed correctly
  let configuration = (typeof __hosted_fields__ !== 'undefined') ? {} /* __hosted_fields__.serverConfig */ : TESTING_CONFIGURATION;
  configuration.assetsUrl = TESTING_CONFIGURATION.assetsUrl;
  configuration.card = TESTING_CONFIGURATION.card;

  let env = (typeof __sdk__ !== 'undefined')
    ? __sdk__.queryOptions.env
    : clientOptions.env;

  return {
    HostedFields: {
      render(options, buttonSelector) : Promise<HostedFieldsHandler> {
        if (!auth || !auth[env]) {
          return Promise.reject(new Error('Invalid auth encountred. Check how you are creating your client.'));
        }

        let orderIdFunction = () => {
          return Promise.resolve().then(() => {
            return options.payment();
          });
        };
        let button;

        if (buttonSelector && options.onAuthorize) {
          button = document.querySelector(buttonSelector);
          if (!button) {
            return Promise.reject(new Error(`Could not find selector \`${ buttonSelector }\` on the page`));
          }
        }

        return btClient.create({
          authorization: auth[env],
          paymentsSdk:   true,
          configuration
        }).then((btClientInstance) => {
          let hostedFieldsCreateOptions = JSON.parse(JSON.stringify(options));

          hostedFieldsCreateOptions.paymentsSdk = true;
          hostedFieldsCreateOptions.client = btClientInstance;
          return hostedFields.create(hostedFieldsCreateOptions);
        }).then((hostedFieldsInstance) => {
          hostedFieldsInstance.submit = createSubmitHandler(hostedFieldsInstance, orderIdFunction);

          if (button) {
            button.addEventListener('click', () => {
              hostedFieldsInstance.submit().then((payload) => {
                return options.onAuthorize(payload);
              }).catch((err) => {

                if (options.onError) {
                  options.onError(err);
                }
              });
            });
          }

          return hostedFieldsInstance;
        });
      }
    },

    HOSTED_FIELDS_CONSTANTS: {
    }
  };
});
