/* @flow */

import { create, type XComponent } from 'xcomponent/src';

let CONTINGENCY_TAG = 'payments-sdk-contingency-handler';

type ContingencyProps = {
  onContingencyResult : (err : mixed, result : Object) => void
};

let ContingencyComponent : XComponent<ContingencyProps> = create({
  tag: CONTINGENCY_TAG
});

function start(url : string) : Promise<Object> {
  return new Promise((resolve, reject) => {
    ContingencyComponent.render({
      url,
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
  start,
  ContingencyComponent
};
