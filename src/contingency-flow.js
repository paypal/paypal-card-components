/* @flow */

import xcomponent from './xcomponent-wrapper';

let CONTINGENCY_TAG = 'payments-sdk-contingency-tag';

function start(url : string) : Promise<Object> {
  return new Promise((resolve, reject) => {
    let contingencyComponent = xcomponent.create({
      tag: CONTINGENCY_TAG,
      url
    });

    contingencyComponent.render({
      onContingencyResult: (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      },
      onError: reject
    }, '#payments-sdk__contingency-lightbox');

  });
}

export default {
  start
};
