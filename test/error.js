/* @flow */

import '../src/index'; // eslint-disable-line import/no-unassigned-import

describe('Error cases', () => {

    it('Should error out if buttonText is not passed to Hosted Fields', () => {

        let client = window.paypal.client();

        let error;

        try {
            client.HostedFields.render({}, 'body');
        } catch (err) {
            error = err;
        }

        if (!error) {
            throw new Error(`Expected Hosted Fields.render call to throw an error`);
        }
    });
});
