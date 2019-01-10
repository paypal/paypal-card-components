/* @flow */

import { getClientID, getPayPalDomain } from '@paypal/sdk-client/src';
import { create, CLASS, CONTEXT, type ZoidComponent } from 'zoid/src';
import { ZalgoPromise } from 'zalgo-promise/src';
import { parseQuery } from 'belter/src';
import { node, dom } from 'jsx-pragmatic/src';

const CONTINGENCY_TAG = 'payments-sdk-contingency-handler';

type ContingencyProps = {
  onContingencyResult : (err : mixed, result : Object) => void
};

let contingencyResolveFunction;

let ContingencyComponent : ZoidComponent<ContingencyProps> = create({
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
      queryParam: true
    },
    onContingencyResult: {
      type: 'function'
    },
    onError: {
      type: 'function'
    }
  },
  tag: CONTINGENCY_TAG,
  containerTemplate({ uid, tag, context, focus, close, outlet, doc }) : HTMLElement {

    function closeComponent(event) : ZalgoPromise<void> {
      event.preventDefault();
      event.stopPropagation();

      if (contingencyResolveFunction) {
        contingencyResolveFunction({ success: false });
        contingencyResolveFunction = null;
      }
      return close();
    }

    function focusComponent(event) : ZalgoPromise<void> {
      event.preventDefault();
      event.stopPropagation();
      // $FlowFixMe
      return focus();
    }
    
    return node('div', { 'id': uid, 'onClick': focusComponent, 'class': `${ tag } ${ tag }-tag-${ tag } ${ tag }-context-${ context } ${ tag }-focus` },

      node('a', { 'href': '#', 'onClick': closeComponent, 'class': `${ tag }-close` }),

      node('node', { el: outlet }),

      node('style', null, `
          #${ uid } {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.6);
              z-index: 400;
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
          `)
    ).render(dom({ doc }));
  }
});

let contingency = {
  Component: ContingencyComponent
};

function start(url : string) : ZalgoPromise<Object> {
  let params = parseQuery(url.split('?')[1]);

  return new ZalgoPromise((resolve, reject) => {
    contingencyResolveFunction = resolve;

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
    }).render(document.body);
  });
}

export default {
  start,
  contingency
};
