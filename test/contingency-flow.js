/* @flow */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';

import '../src/index';
import contingencyFlow from '../src/contingency-flow';

import rejectIfResolves from './utils/reject-if-resolves';

describe('contingency-flow', () => {
  let fakeContingencyComponentRender;

  beforeEach(() => {
    let ContingencyComponent = contingencyFlow.getContingencyComponent();

    fakeContingencyComponentRender = td.replace(ContingencyComponent, 'render');
  });

  afterEach(() => {
    td.reset();
  });

  it('renders a zoid component', () => {
    contingencyFlow.start('https://example.com?cart_id=abc123&action=action&xcomponent=1&flow=contingency');

    td.verify(fakeContingencyComponentRender({
      action:              'action',
      xcomponent:           '1',
      flow:                'contingency',
      cart_id:             'abc123',
      onContingencyResult: td.matchers.isA(Function),
      onError:             td.matchers.isA(Function)
    }, document.body));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    let promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    let onContingencyResult = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onContingencyResult;
    let error = {
      code:        42,
      description: 'The error of life'
    };

    onContingencyResult(error);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, error);
    });
  });

  it('rejects when contingency returns an error object with description only', () => {
    let promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    let onContingencyResult = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onContingencyResult;
    let error = {
      description: 'The error of life'
    };

    onContingencyResult(error);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, error);
    });
  });

  it('resolves when contingency is successful', () => {
    let promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    let onContingencyResult = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onContingencyResult;

    onContingencyResult(null, {
      success: true
    });

    return promise.then((result) => {
      assert(result.success);
    });
  });

  it('rejects when onError is called with an error', () => {
    let randomError = new Error('spooky');
    let promise = contingencyFlow.start('https://example.com?cart_id=abc123&action=contingency&xcomponent=1&flow=contingency');
    let onError = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onError;

    onError(randomError);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, randomError);
    });
  });
});
