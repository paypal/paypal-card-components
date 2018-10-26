/* @flow */
import { getClientID, getPayPalDomain } from 'paypal-braintree-web-client/src';
import { create } from 'zoid/src';
import { type Component } from 'zoid/src/component/component';
import { ZalgoPromise } from 'zalgo-promise/src';

const CONTINGENCY_TAG = 'payments-sdk-contingency-handler';
const LIGHTBOX_ID = 'payments-sdk__contingency-lightbox';

let lightbox = document.createElement('div');
lightbox.id = LIGHTBOX_ID;

type ContingencyProps = {
  onContingencyResult : (err : mixed, result : Object) => void
};

let ContingencyComponent : Component<ContingencyProps> = create({
  buildUrl: () => `${ getPayPalDomain() }/webapps/helios`,
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
  containerTemplate({ id, CLASS, CONTEXT, tag, context, actions, outlet, jsxDom }) : HTMLElement {

    function close(event) : ZalgoPromise<void> {
      event.preventDefault();
      event.stopPropagation();
      return actions.close();
    }

    function focus(event) : ZalgoPromise<void> {
      event.preventDefault();
      event.stopPropagation();
      return actions.focus();
    }

    return jsxDom('div', { id, 'onClick': focus, 'class': `${ CLASS.ZOID } ${ CLASS.ZOID }-tag-${ tag } ${ CLASS.ZOID }-context-${ context } ${ CLASS.ZOID }-focus` },

      jsxDom('a', { 'href': '#', 'onClick': close, 'class': `${ CLASS.ZOID }-close` }),

      outlet,

      jsxDom('style', null, `
        #${ id } {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            z-index: 400;
        }

        #${ id }.${ CLASS.ZOID }-context-${ CONTEXT.POPUP } {
            cursor: pointer;
        }

        #${ id }.${ CLASS.ZOID }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } {
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

        #${ id }.${ CLASS.ZOID }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } {
            height: 510px;
            width: 450px;
        }

        #${ id }.${ CLASS.ZOID }-context-${ CONTEXT.IFRAME } .${ CLASS.OUTLET } iframe {
            height: 100%;
            width: 100%;
            position: absolute;
            top: 0;
            left: 0;
            transition: opacity .2s ease-in-out;
        }

        #${ id } > .${ CLASS.OUTLET } > iframe.${ CLASS.VISIBLE } {
            opacity: 1;
        }

        #${ id } > .${ CLASS.OUTLET } > iframe.${ CLASS.INVISIBLE } {
            opacity: 0;
        }

        #${ id } > .${ CLASS.OUTLET } > iframe.${ CLASS.COMPONENT_FRAME } {
            z-index: 200;
        }

        #${ id } > .${ CLASS.OUTLET } > iframe.${ CLASS.PRERENDER_FRAME } {
            z-index: 100;
        }

        #${ id } .${ CLASS.ZOID }-close {
            position: absolute;
            right: 16px;
            top: 16px;
            width: 16px;
            height: 16px;
            opacity: 0.6;
        }

        #${ id } .${ CLASS.ZOID }-close:hover {
            opacity: 1;
        }

        #${ id } .${ CLASS.ZOID }-close:before,
        #${ id } .${ CLASS.ZOID }-close:after {
            position: absolute;
            left: 8px;
            content: ' ';
            height: 16px;
            width: 2px;
            background-color: white;
        }

        #${ id } .${ CLASS.ZOID }-close:before {
            transform: rotate(45deg);
        }

        #${ id } .${ CLASS.ZOID }-close:after {
            transform: rotate(-45deg);
        }
        `)
    );
  }
});
function start(url : string) : ZalgoPromise<Object> {
  let queryString = url.split('?')[1];
  let params = queryString.split('&').reduce((obj, pair) => {
    let pieces = pair.split('=');

    obj[pieces[0]] = pieces[1];

    return obj;
  }, {});

  if (!document.body) {
    throw new Error(`Could not find document.body`);
  }

  document.body.appendChild(lightbox);

  return new ZalgoPromise((resolve, reject) => {
    ContingencyComponent.render({
      action:              params.action,
      xcomponent:          '1',
      flow:                params.flow,
      cart_id:             params.cart_id,
      onContingencyResult: (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      },
      onError: reject
    }, `#${ LIGHTBOX_ID }`);

  });
}

export default {
  start,
  ContingencyComponent
};
