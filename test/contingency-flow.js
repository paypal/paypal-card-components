/* @flow */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';

import '../src/index';
import contingencyFlow from '../src/contingency-flow';

import rejectIfResolves from './utils/reject-if-resolves';

describe('contingency-flow', () => {
  let fakeContingencyComponentRender;

  beforeEach(() => {
    fakeContingencyComponentRender = td.replace(contingencyFlow.ContingencyComponent, 'render');
  });

  afterEach(() => {
    td.reset();
  });

  it('renders a xcomponent', () => {
    contingencyFlow.start('https://example.com');

    td.verify(fakeContingencyComponentRender({
      url:                 td.matchers.isA(String),
      onContingencyResult: td.matchers.isA(Function),
      onError:             td.matchers.isA(Function)
    }, '#payments-sdk__contingency-lightbox'));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    let promise = contingencyFlow.start('https://example.com');
    let onContingencyResult = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onContingencyResult;

    onContingencyResult({
      code:        42,
      description: 'The error of life'
    });

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err.code, 42);
      assert.equal(err.description, 'The error of life');
    });
  });

  it('rejects when contingency returns an error object with description only', () => {
    let promise = contingencyFlow.start('https://example.com');
    let onContingencyResult = td.explain(fakeContingencyComponentRender).calls[0].args[0]
      .onContingencyResult;

    onContingencyResult({
      description: 'The error of life'
    });

    return promise.then(rejectIfResolves).catch((err) => {
      assert.equal(err.description, 'The error of life');
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
