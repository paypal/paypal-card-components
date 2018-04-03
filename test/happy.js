/* @flow */

import '../src/index'; // eslint-disable-line import/no-unassigned-import

describe('Happy cases', () => {

    it('Should create an instance of the client and render HostedFields', () => {

        let body = document.body;
        if (!body) {
            throw new Error(`Expected document.body to be present`);
        }

        let container = document.createElement('div');
        container.id = 'hosted-fields-container';
        body.appendChild(container);

        let client = window.paypal.client();
        client.HostedFields.render({
            buttonText: 'Pay Now'
        }, '#hosted-fields-container');

        let button = container.querySelector('button');
        if (!button) {
            throw new Error(`Expected button to be rendered`);
        }

        if (!button.innerText) {
            throw new Error(`Expected button to have text`);
        }

        if (button.innerText !== 'Pay Now') {
            throw new Error(`Expected button text to be "Pay Now", got "${ button.innerText.toString() }"`);
        }

        body.removeChild(container);
    });
});
