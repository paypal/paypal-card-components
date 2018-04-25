/* @flow */

import assert from 'assert';

import td from 'testdouble/dist/testdouble';

import '../src/index';
import contingencyFlow from '../src/contingency-flow';
import xcomponent from '../src/xcomponent-wrapper';

import rejectIfResolves from './utils/reject-if-resolves';

describe('contingency-flow', () => {
  let fakeXcomponentCreate;
  let fakeXcomponentInstance;

  beforeEach(() => {
    fakeXcomponentCreate = td.replace(xcomponent, 'create');
    fakeXcomponentInstance = td.object([ 'render' ]);

    td.when(fakeXcomponentCreate(td.matchers.isA(Object))).thenReturn(fakeXcomponentInstance);
  });

  afterEach(() => {
    td.reset();
  });

  it('creates a xcomponent with the contingency tag and url', () => {
    contingencyFlow.start('https://example.com');

    td.verify(fakeXcomponentCreate({
      tag: 'payments-sdk-contingency-tag',
      url: 'https://example.com'
    }));
  });

  it('renders a xcomponent', () => {
    contingencyFlow.start('https://example.com');

    td.verify(fakeXcomponentInstance.render({
      onContingencyResult: td.matchers.isA(Function)
    }, '#payments-sdk__contingency-lightbox'));
  });

  it('rejects when contingency returns an error object with code and description', () => {
    let promise = contingencyFlow.start('https://example.com');
    let onContingencyResult = td.explain(fakeXcomponentInstance.render).calls[0].args[0]
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
    let onContingencyResult = td.explain(fakeXcomponentInstance.render).calls[0].args[0]
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
    let onContingencyResult = td.explain(fakeXcomponentInstance.render).calls[0].args[0]
      .onContingencyResult;

    onContingencyResult(null, {
      success: true
    });

    return promise.then((result) => {
      assert(result.success);
    });
  });
});
