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
    contingencyFlow.start('https://example.com?action=foo&flow=bar&cart_id=baz');

    td.verify(fakeContingencyComponentRender({
      action:              'foo',
      xcomponent:           '1',
      flow:                'bar',
      cart_id:             'baz',
      onContingencyResult: td.matchers.isA(Function),
      onError:             td.matchers.isA(Function)
    }, '#payments-sdk__contingency-lightbox'));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    let promise = contingencyFlow.start('https://example.com');
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
    let promise = contingencyFlow.start('https://example.com');
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
    let promise = contingencyFlow.start('https://example.com');
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
    let promise = contingencyFlow.start('https://example.com');
    let onError = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onError;

    onError(randomError);

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err, randomError);
    });
  });
});
