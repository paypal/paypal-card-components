/* @flow */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';

import '../src/index';
import contingencyFlow from '../src/contingency-flow';

import rejectIfResolves from './utils/reject-if-resolves';

describe('contingency-flow', () => {
  let fakeContingencyInit;
  let fakeContingencyComponentRender;

  beforeEach(() => {
    fakeContingencyInit = td.replace(contingencyFlow.contingency, 'Component');
    fakeContingencyComponentRender = td.func();
    td.when(fakeContingencyInit(), { ignoreExtraArgs: true }).thenReturn({
      render: fakeContingencyComponentRender
    });
  });

  afterEach(() => {
    td.reset();
  });

  it('renders a zoid component', () => {
    contingencyFlow.start('https://example.com?cart_id=abc123&action=action&xcomponent=1&flow=contingency');

    td.verify(fakeContingencyInit({
      action:              'action',
      xcomponent:           '1',
      flow:                'contingency',
      cart_id:             'abc123',
      onContingencyResult: td.matchers.isA(Function),
      onError:             td.matchers.isA(Function)
    }));

    td.verify(fakeContingencyComponentRender(document.body));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    const promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyInit).calls[0].args[0]
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
    const promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyInit).calls[0].args[0]
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
    const promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onContingencyResult = td.explain(fakeContingencyInit).calls[0].args[0]
      .onContingencyResult;

    onContingencyResult(null, {
      success: true
    });

    return promise.then((result) => {
      assert(result.success);
    });
  });

  it('rejects when onError is called with an error', () => {
    const randomError = new Error('spooky');
    const promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    const onError = td.explain(fakeContingencyInit).calls[0].args[0]
      .onError;

    onError(randomError);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, randomError);
    });
  });
});
