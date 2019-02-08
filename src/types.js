/* @flow */

import { ZalgoPromise } from 'zalgo-promise/src';

type SubmitFunctionType = (options? : Object) => ZalgoPromise<Object>;

export type HostedFieldsHandler = {|
    submit : SubmitFunctionType
|};

export type FundingEligibilityType = {|
    card : {
        eligible : boolean,
        branded : boolean,
        vendors : {
            visa : {
                eligible : boolean
            },
            mastercard : {
                eligible : boolean
            },
            amex : {
                eligible : boolean
            },
            discover : {
                eligible : boolean
            },
            hiper : {
                eligible : boolean
            },
            elo : {
                eligible : boolean
            },
            jcb : {
                eligible : boolean
            },
            cup : {
                eligible : boolean
            }
        }
    }
|};

export type HostedFieldsServerConfigType = {|
    fundingEligibility : FundingEligibilityType
|};

export type HostedFieldsGlobalType = {|
    serverConfig : HostedFieldsServerConfigType,
    featureFlags : {
        
    }
|};
