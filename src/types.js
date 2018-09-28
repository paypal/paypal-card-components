/* @flow */

import type { FundingEligibilityType } from 'paypal-braintree-web-client/src';
import { ZalgoPromise } from 'zalgo-promise/src';

type SubmitFunctionType = (options? : Object) => ZalgoPromise<Object>;

export type HostedFieldsHandler = {
    submit : SubmitFunctionType
};

export type HostedFieldsServerConfigType = {
    fundingEligibility : FundingEligibilityType
};

export type HostedFieldsGlobalType = {
    serverConfig : HostedFieldsServerConfigType,
    featureFlags : {
        
    }
};
