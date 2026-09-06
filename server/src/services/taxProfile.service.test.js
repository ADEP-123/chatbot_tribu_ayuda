const test = require('node:test');
const assert = require('node:assert');
const { getMissingFields, REQUIRED_FIELDS } = require('./taxProfile.service');

test('un perfil vacío debe reportar todos los campos como faltantes', () => {
  const missing = getMissingFields(null);
  assert.strictEqual(missing.length, REQUIRED_FIELDS.length);
});

test('un perfil completo no debe reportar campos faltantes', () => {
  const profile = {
    ingresosBrutos: 72000000,
    patrimonioBruto: 0,
    consumosTarjeta: 0,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: false,
  };
  assert.strictEqual(getMissingFields(profile).length, 0);
});

test('un valor de 0 cuenta como respondido, pero null o undefined no', () => {
  const profile = {
    ingresosBrutos: 0,
    patrimonioBruto: null,
    consumosTarjeta: undefined,
    comprasConsumos: 0,
    consignaciones: 0,
    esResponsableIva: false,
  };
  const camposFaltantes = getMissingFields(profile)
    .map((m) => m.field)
    .sort();
  assert.deepStrictEqual(camposFaltantes, ['consumosTarjeta', 'patrimonioBruto']);
});

test('un perfil parcial reporta solo los campos no respondidos', () => {
  const profile = { ingresosBrutos: 50000000, esResponsableIva: false };
  const camposFaltantes = getMissingFields(profile)
    .map((m) => m.field)
    .sort();
  assert.deepStrictEqual(
    camposFaltantes,
    ['comprasConsumos', 'consignaciones', 'consumosTarjeta', 'patrimonioBruto'].sort()
  );
});
