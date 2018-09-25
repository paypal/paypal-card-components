/* @flow */

import type { FundingEligibilityType } from 'paypal-braintree-web-client/src';

type SubmitFunctionType = (options? : Object) => Promise<Object>;

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
