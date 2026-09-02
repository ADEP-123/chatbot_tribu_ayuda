const test = require('node:test');
const assert = require('node:assert');
const { evaluateObligation } = require('./taxRules.service');

const taxYear2025 = {
  year: 2025,
  uvtValue: 49799,
  topePatrimonioUvt: 4500,
  topeIngresosUvt: 1400,
  topeConsumosUvt: 1400,
  topeComprasUvt: 1400,
  topeConsignacionesUvt: 1400,
};

test('no debe declarar si está por debajo de todos los topes', () => {
  const profile = {
    patrimonioBruto: 10000000,
    ingresosBrutos: 20000000,
    consumosTarjeta: 0,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: false,
  };
  const result = evaluateObligation(profile, taxYear2025);
  assert.strictEqual(result.debeDeclarar, false);
  assert.strictEqual(result.motivos.length, 0);
});

test('debe declarar si supera el tope de ingresos', () => {
  const profile = {
    patrimonioBruto: 10000000,
    ingresosBrutos: 70000000, // > 1400 UVT
    consumosTarjeta: 0,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: false,
  };
  const result = evaluateObligation(profile, taxYear2025);
  assert.strictEqual(result.debeDeclarar, true);
  assert.strictEqual(result.motivos[0].criterio, 'ingresos');
});

test('debe declarar si es responsable de IVA aunque no supere ningún tope', () => {
  const profile = {
    patrimonioBruto: 0,
    ingresosBrutos: 0,
    consumosTarjeta: 0,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: true,
  };
  const result = evaluateObligation(profile, taxYear2025);
  assert.strictEqual(result.debeDeclarar, true);
  assert.strictEqual(result.motivos[0].criterio, 'responsableIva');
});

test('debe declarar si supera varios topes a la vez', () => {
  const profile = {
    patrimonioBruto: 300000000,
    ingresosBrutos: 100000000,
    consumosTarjeta: 0,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: false,
  };
  const result = evaluateObligation(profile, taxYear2025);
  assert.strictEqual(result.debeDeclarar, true);
  assert.strictEqual(result.motivos.length, 2);
});
