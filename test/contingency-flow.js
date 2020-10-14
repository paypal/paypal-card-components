/* @flow */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';
import { destroy } from 'zoid/src';

import '../src/index';
import contingencyFlow from '../src/contingency-flow';

import rejectIfResolves from './utils/reject-if-resolves';

describe('contingency-flow', () => {
  let fakeContingencyFlowComponent;
  let fakeContingencyFlowComponentRender;

  beforeEach(() => {
    fakeContingencyFlowComponentRender = td.func();
    fakeContingencyFlowComponent = td.func();

    td.when(fakeContingencyFlowComponent(), { ignoreExtraArgs: true }).thenReturn({
      render: fakeContingencyFlowComponentRender
    });
  });

  afterEach(() => {
    td.reset();
    return destroy();
  });

  it('renders a zoid component', () => {
    contingencyFlow.start(fakeContingencyFlowComponent, 'https://example.com?cart_id=abc123&action=action&xcomponent=1&flow=contingency');

    td.verify(fakeContingencyFlowComponent({
      action:              'action',
      xcomponent:           '1',
      flow:                'contingency',
      cart_id:             'abc123',
      onContingencyResult: td.matchers.isA(Function),
      onError:             td.matchers.isA(Function)
    }));

    td.verify(fakeContingencyFlowComponentRender(document.body));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    const promise = contingencyFlow.start(fakeContingencyFlowComponent, 'https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyFlowComponent).calls[0].args[0]
      .onContingencyResult;
    const error = {
      code:        42,
      description: 'The error of life'
    };

    onContingencyResult(error);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, error);
    });
  });

  it('rejects when contingency returns an error object with description only', () => {
    const promise = contingencyFlow.start(fakeContingencyFlowComponent, 'https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyFlowComponent).calls[0].args[0]
      .onContingencyResult;
    const error = {
      description: 'The error of life'
    };

    onContingencyResult(error);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, error);
    });
  });

  it('resolves when contingency is successful', () => {
    const promise = contingencyFlow.start(fakeContingencyFlowComponent, 'https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyFlowComponent).calls[0].args[0]
      .onContingencyResult;

    const threeDSResult = {
      success:                      true,
      liability_shift:              'YES',
      status:                       'YES',
      authentication_status_reason: 'UNAVAILABLE'
    };

    onContingencyResult(null, threeDSResult);

    return promise.then((result) => {
      assert.equal(result, threeDSResult);
    });
  });

  it('rejects when onError is called with an error', () => {
    const randomError = new Error('spooky');
    const promise = contingencyFlow.start(fakeContingencyFlowComponent, 'https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onError = td.explain(fakeContingencyFlowComponent).calls[0].args[0]
      .onError;

    onError(randomError);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, randomError);
    });
  });
});
