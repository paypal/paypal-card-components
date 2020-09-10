/* @flow */

export type ContingencyFlowProps = {|
    action : string,
    cart_id : string,
    flow : string,
    xcomponent : string,
    onContingencyResult : (err : mixed, result : Object) => void
|};
