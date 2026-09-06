const test = require('node:test');
const assert = require('node:assert');
const { isNegativeZeroAnswer } = require('./conversation.service');

test('reconoce negaciones comunes como cero', () => {
  assert.strictEqual(isNegativeZeroAnswer('no he usado tarjeta este año'), true);
  assert.strictEqual(isNegativeZeroAnswer('ninguna otra compra grande'), true);
  assert.strictEqual(isNegativeZeroAnswer('nada'), true);
  assert.strictEqual(isNegativeZeroAnswer('no tengo eso'), true);
});

test('NO trata como cero si hay una cifra mencionada', () => {
  assert.strictEqual(isNegativeZeroAnswer('no estoy seguro pero podrían ser 5 millones'), false);
});

test('respuestas afirmativas normales no activan el atajo', () => {
  assert.strictEqual(isNegativeZeroAnswer('gasté 900 mil en tarjeta'), false);
});
