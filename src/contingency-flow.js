/* @flow */
/* eslint import/no-default-export: off */

import { getLogger, getClientID, getPayPalDomain, getSDKMeta } from '@paypal/sdk-client/src';
import { create, CONTEXT, EVENT, type ZoidComponent } from 'zoid/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { parseQuery, destroyElement } from 'belter/src';
import { node, dom } from 'jsx-pragmatic/src';

const CONTINGENCY_TAG = 'payments-sdk-contingency-handler';

const CLASS = {
  OUTLET:          'outlet',
  VISIBLE:         'visible',
  INVISIBLE:       'invisible',
  COMPONENT_FRAME: 'component-frame',
  PRERENDER_FRAME: 'prerender-frame'
};

type ContingencyProps = {|
  action : string,
  cart_id : string,
  flow : string,
  xcomponent : string,
  onContingencyResult : (err : mixed, result : Object) => void
|};

let contingencyResolveFunction;

const ContingencyComponent : ZoidComponent<ContingencyProps> = create({
  url:      () => `${ getPayPalDomain() }/webapps/helios`,
  props:    {
    action: {
      type:       'string',
      queryParam: true
    },
    xcomponent: {
      type:       'string',
      queryParam: true
    },
    flow: {
      type:       'string',
      queryParam: true
    },
    cart_id: {
      type:       'string',
      queryParam: true
    },
    clientID: {
      type:       'string',
      value:      getClientID,
      queryParam: 'client_id'
    },
    onContingencyResult: {
      type: 'function'
    },
    onError: {
      type: 'function'
    },
    sdkMeta: {
      type:        'string',
      queryParam:  true,
      sendToChild: false,
      value:       () => getSDKMeta()
    }
  },
  tag: CONTINGENCY_TAG,
  containerTemplate({ uid, tag, context, focus, close, frame, prerenderFrame, doc, event }) : ?HTMLElement {
    if (!frame || !prerenderFrame) {
      return;
    }

    function closeComponent(err) : ZalgoPromise<void> {
      err.preventDefault();
      err.stopPropagation();

      if (contingencyResolveFunction) {
        getLogger().info(`SKIPPED_BY_BUYER`);
        contingencyResolveFunction({
          success:                      false,
          liability_shift:              'NO',
          status:                       'NO',
          authentication_status_reason: 'SKIPPED_BY_BUYER'
        });
        contingencyResolveFunction = null;
      }
      return close();
    }

    function focusComponent(err) : ZalgoPromise<void> {
      err.preventDefault();
      err.stopPropagation();
      // $FlowFixMe
      return focus();
    }

    frame.classList.add(CLASS.COMPONENT_FRAME);
    prerenderFrame.classList.add(CLASS.PRERENDER_FRAME);

    frame.classList.add(CLASS.INVISIBLE);
    prerenderFrame.classList.add(CLASS.VISIBLE);

    event.on(EVENT.RENDERED, () => {
      prerenderFrame.classList.remove(CLASS.VISIBLE);
      prerenderFrame.classList.add(CLASS.INVISIBLE);

      frame.classList.remove(CLASS.INVISIBLE);
      frame.classList.add(CLASS.VISIBLE);

      setTimeout(() => {
        destroyElement(prerenderFrame);
      }, 1);
    });
    
    /* eslint function-call-argument-newline: off */
    return node('div', { 'id': uid, 'onClick': focusComponent, 'class': `${ tag } ${ tag }-tag-${ tag } ${ tag }-context-${ context } ${ tag }-focus` },

      node('a', { 'href': '#', 'onClick': closeComponent, 'class': `${ tag }-close` }),

      node('div', { class: CLASS.OUTLET },
        node('node', { el: frame }),
        node('node', { el: prerenderFrame })),

      node('style', null, `
          #${ uid } {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.6);
              z-index: 999;
          }

          #${ uid }.${ tag }-context-${ CONTEXT.POPUP } {
              cursor: pointer;
          }

          #${ uid }.${ tag }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } {
              box-shadow: 2px 2px 10px 3px rgba(0, 0, 0, 0.4);
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate3d(-50%, -50%, 0);
              -webkit-transform: translate3d(-50%, -50%, 0);
              -moz-transform: translate3d(-50%, -50%, 0);
              -o-transform: translate3d(-50%, -50%, 0);
              -ms-transform: translate3d(-50%, -50%, 0);
          }

          #${ uid }.${ tag }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } {
              height: 510px;
              width: 450px;
          }

          #${ uid }.${ tag }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } iframe {
              height: 100%;
              width: 100%;
              position: absolute;
              top: 0;
              left: 0;
              transition: opacity .2s ease-in-out;
          }

          #${ uid } > .${ CLASS.OUTLET } > iframe.${ CLASS.VISIBLE } {
              opacity: 1;
          }

          #${ uid } > .${ CLASS.OUTLET } > iframe.${ CLASS.INVISIBLE } {
              opacity: 0;
          }

          #${ uid } > .${ CLASS.OUTLET } > iframe.${ CLASS.COMPONENT_FRAME } {
              z-index: 200;
          }

          #${ uid } > .${ CLASS.OUTLET } > iframe.${ CLASS.PRERENDER_FRAME } {
              z-index: 100;
          }

          #${ uid } .${ tag }-close {
              position: absolute;
              right: 16px;
              top: 16px;
              width: 16px;
              height: 16px;
              opacity: 0.6;
          }

          #${ uid } .${ tag }-close:hover {
              opacity: 1;
          }

          #${ uid } .${ tag }-close:before,
          #${ uid } .${ tag }-close:after {
              position: absolute;
              left: 8px;
              content: ' ';
              height: 16px;
              width: 2px;
              background-color: white;
          }

          #${ uid } .${ tag }-close:before {
              transform: rotate(45deg);
          }

          #${ uid } .${ tag }-close:after {
              transform: rotate(-45deg);
          }
          `)).render(dom({ doc }));
  }
});

if (ContingencyComponent.isChild()) {
  window.xchild = {
    close: () => window.xprops.close()
  };
}

const contingency = {
  Component: ContingencyComponent
};

function start(url : string) : ZalgoPromise<Object> {
  const params = parseQuery(url.split('?')[1]);
  
  const body = document.body;
  if (!body) {
    throw new Error(`No document body available to render to`);
  }

  return new ZalgoPromise((resolve, reject) => {
    contingencyResolveFunction = resolve;

    // $FlowFixMe
    contingency.Component({
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
  start,
  contingency
};
