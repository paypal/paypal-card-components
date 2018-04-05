/* @flow */

type SubmitFunctionType = (tokenizeOptions : Object) => Promise<Object>;

export type HostedFieldsHandler = {
    submit : SubmitFunctionType
};
