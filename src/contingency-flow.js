/* @flow */
/* eslint import/no-default-export: off */
import { getLogger } from '@paypal/sdk-client/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { parseQuery } from 'belter/src';
import type { ZoidComponent } from 'zoid/src';

import type { ContingencyFlowProps } from './zoid/contingency-flow/props';

let contingencyResolveFunction;

function skip() {
  if (!contingencyResolveFunction) {
    return;
  }

  getLogger().info(`SKIPPED_BY_BUYER`);
  contingencyResolveFunction({
    success:                      false,
    liability_shift:              'NO',
    status:                       'NO',
    authentication_status_reason: 'SKIPPED_BY_BUYER'
  });
  contingencyResolveFunction = null;
}

function start(ContingencyFlowComponent : ZoidComponent<ContingencyFlowProps>, url : string) : ZalgoPromise<Object> {
  const params = parseQuery(url.split('?')[1]);
  const body = document.body;

  if (!body) {
    throw new Error(`No document body available to render to`);
  }

  return new ZalgoPromise((resolve, reject) => {
    contingencyResolveFunction = resolve;

    // $FlowFixMe
    ContingencyFlowComponent({
      action:              params.action,
      xcomponent:          '1',
      flow:                params.flow,
      cart_id:             params.cart_id,
      onContingencyResult: (err, result) => {
        contingencyResolveFunction = null;

        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      },
      onError:             (err) => {
        contingencyResolveFunction = null;
        reject(err);
      }
    }).render(body);
  });
}

export default {
  skip,
  start
};
