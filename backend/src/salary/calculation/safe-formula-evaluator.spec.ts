import test from 'node:test';
import assert from 'node:assert/strict';
import { SafeFormulaEvaluator } from './safe-formula-evaluator';

test('SafeFormulaEvaluator - basic arithmetic & precedence', () => {
  assert.equal(SafeFormulaEvaluator.evaluate('10 + 20', {}), 30);
  assert.equal(SafeFormulaEvaluator.evaluate('50 - 15', {}), 35);
  assert.equal(SafeFormulaEvaluator.evaluate('10 * 4', {}), 40);
  assert.equal(SafeFormulaEvaluator.evaluate('100 / 4', {}), 25);
  assert.equal(SafeFormulaEvaluator.evaluate('10 + 20 * 2', {}), 50); // Multiplication first
  assert.equal(SafeFormulaEvaluator.evaluate('(10 + 20) * 2', {}), 60); // Parentheses first
  assert.equal(SafeFormulaEvaluator.evaluate('100 - (20 + 30)', {}), 50);
});

test('SafeFormulaEvaluator - variable resolution', () => {
  const context = {
    BASIC: 30000,
    HRA: 12000,
    GROSS: 50000,
  };

  assert.equal(SafeFormulaEvaluator.evaluate('BASIC * 0.40', context), 12000);
  assert.equal(SafeFormulaEvaluator.evaluate('BASIC + HRA', context), 42000);
  assert.equal(SafeFormulaEvaluator.evaluate('GROSS - BASIC - HRA', context), 8000);
  assert.equal(SafeFormulaEvaluator.evaluate('(BASIC + HRA) * 0.12', context), 5040);
});

test('SafeFormulaEvaluator - division by zero', () => {
  // Should return 0 rather than Infinity or crashing
  assert.equal(SafeFormulaEvaluator.evaluate('1000 / 0', {}), 0);
  assert.equal(SafeFormulaEvaluator.evaluate('BASIC / ZERO', { BASIC: 500, ZERO: 0 }), 0);
});

test('SafeFormulaEvaluator - security checks & forbidden keywords', () => {
  assert.throws(
    () => SafeFormulaEvaluator.tokenize('process.env.SECRET'),
    /Forbidden token in formula/
  );
  assert.throws(
    () => SafeFormulaEvaluator.tokenize('eval("malicious")'),
    /Forbidden token in formula/
  );
  assert.throws(
    () => SafeFormulaEvaluator.tokenize('window.alert(1)'),
    /Forbidden token in formula/
  );
  assert.throws(
    () => SafeFormulaEvaluator.tokenize('require("fs")'),
    /Forbidden token in formula/
  );
  assert.throws(
    () => SafeFormulaEvaluator.tokenize('BASIC @ 5'),
    /Invalid character '@'/
  );
});

test('SafeFormulaEvaluator - extract variables', () => {
  const vars = SafeFormulaEvaluator.extractVariables('GROSS - (BASIC + HRA) + SPECIAL');
  assert.deepEqual(vars.sort(), ['BASIC', 'GROSS', 'HRA', 'SPECIAL'].sort());
});

test('SafeFormulaEvaluator - topological sorting & evaluation order', () => {
  const components = [
    { code: 'SPECIAL', calculationType: 'FORMULA' as const, formula: 'GROSS - BASIC - HRA' },
    { code: 'HRA', calculationType: 'PERCENTAGE' as const, percentageOf: 'BASIC' },
    { code: 'BASIC', calculationType: 'FIXED' as const },
    { code: 'PF', calculationType: 'PERCENTAGE' as const, percentageOf: 'BASIC' },
  ];

  const order = SafeFormulaEvaluator.getEvaluationOrder(components);
  const codes = order.map((c) => c.code);
  
  // BASIC must precede HRA and PF
  assert.ok(codes.indexOf('BASIC') < codes.indexOf('HRA'));
  assert.ok(codes.indexOf('BASIC') < codes.indexOf('PF'));
  // HRA must precede SPECIAL
  assert.ok(codes.indexOf('HRA') < codes.indexOf('SPECIAL'));
});

test('SafeFormulaEvaluator - circular dependency detection', () => {
  const components = [
    { code: 'COMP_A', calculationType: 'PERCENTAGE' as const, percentageOf: 'COMP_B' },
    { code: 'COMP_B', calculationType: 'PERCENTAGE' as const, percentageOf: 'COMP_A' },
  ];

  assert.throws(
    () => SafeFormulaEvaluator.getEvaluationOrder(components),
    /Circular salary component dependency detected/
  );
});
