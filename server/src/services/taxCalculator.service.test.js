const test = require('node:test');
const assert = require('node:assert');
const { calculateEstimatedTax } = require('./taxCalculator.service');

const BRACKETS = [
  { rangoDesdeUvt: 0, rangoHastaUvt: 1090, tarifaMarginal: 0, impuestoBaseUvt: 0 },
  { rangoDesdeUvt: 1090, rangoHastaUvt: 1700, tarifaMarginal: 0.19, impuestoBaseUvt: 0 },
  { rangoDesdeUvt: 1700, rangoHastaUvt: 4100, tarifaMarginal: 0.28, impuestoBaseUvt: 116 },
  { rangoDesdeUvt: 4100, rangoHastaUvt: 8670, tarifaMarginal: 0.33, impuestoBaseUvt: 788 },
];

const UVT_2025 = 49799;

test('renta bajo 1090 UVT no paga impuesto', () => {
  const result = calculateEstimatedTax(1000 * UVT_2025, UVT_2025, BRACKETS);
  assert.strictEqual(result.impuestoUvt, 0);
});

test('renta de 3000 UVT calcula igual que el ejemplo oficial (480 UVT en total)', () => {
  const result = calculateEstimatedTax(3000 * UVT_2025, UVT_2025, BRACKETS);
  // 116 UVT acumulados de tramos anteriores + (3000 - 1700) × 28% = 116 + 364 = 480 UVT
  assert.ok(Math.abs(result.impuestoUvt - 480) < 0.01);
});

test('nunca devuelve un impuesto negativo', () => {
  const result = calculateEstimatedTax(0, UVT_2025, BRACKETS);
  assert.strictEqual(result.impuestoPesos, 0);
});
