/* @flow */

type SubmitFunctionType = (tokenizeOptions : Object) => Promise<Object>;

export type HostedFieldsHandler = {
    submit : SubmitFunctionType
};

export type HostedFieldsServerConfigType = {
    clientConfiguration : {
        assetsUrl : string
    }
};

export type HostedFieldsGlobalType = {
    serverConfig : HostedFieldsServerConfigType,
    featureFlags : {
        
    }
};
