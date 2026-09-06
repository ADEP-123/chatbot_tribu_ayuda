const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const prisma = require('../db');
const reportService = require('./report.service');
const taxProfileService = require('./taxProfile.service');

const TEST_YEAR = 9001; // año ficticio dedicado a pruebas, nunca choca con datos reales

describe('report.service', () => {
  let userId;

  before(async () => {
    await prisma.taxYear.upsert({
      where: { year: TEST_YEAR },
      update: {},
      create: {
        year: TEST_YEAR,
        uvtValue: 49799,
        topePatrimonioUvt: 4500,
        topeIngresosUvt: 1400,
        topeConsumosUvt: 1400,
        topeComprasUvt: 1400,
        topeConsignacionesUvt: 1400,
        sancionMinimaUvt: 10,
        declarationStart: new Date('2026-08-12'),
        declarationEnd: new Date('2026-10-26'),
      },
    });

    const user = await prisma.user.upsert({
      where: { email: 'test-report-service@example.com' },
      update: {},
      create: { email: 'test-report-service@example.com', password: 'no-se-usa-en-este-test' },
    });
    userId = user.id;
  });

  after(async () => {
    await prisma.report.deleteMany({ where: { userId } });
    await prisma.taxProfile.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.taxYear.delete({ where: { year: TEST_YEAR } });
    await prisma.$disconnect();
  });

  it('NO debe declarar si está bajo todos los topes', async () => {
    await taxProfileService.upsertProfile(userId, TEST_YEAR, {
      ingresosBrutos: 10000000,
      patrimonioBruto: 5000000,
      consumosTarjeta: 0,
      comprasConsumos: 0,
      consignaciones: 0,
      esResponsableIva: false,
    });

    const report = await reportService.generateReport(userId, TEST_YEAR);

    assert.strictEqual(report.debeDeclarar, false);
    assert.strictEqual(report.motivos.length, 0);
    assert.strictEqual(report.fechaLimite, null);
    assert.deepStrictEqual(report.camposFaltantes, []);
  });

  it('SÍ debe declarar si supera el tope de ingresos', async () => {
    await taxProfileService.upsertProfile(userId, TEST_YEAR, { ingresosBrutos: 100000000 });

    const report = await reportService.generateReport(userId, TEST_YEAR);

    assert.strictEqual(report.debeDeclarar, true);
    assert.ok(report.motivos.some((m) => m.criterio === 'ingresos'));
    assert.ok(report.fechaLimite !== null);
  });

  it('deja constancia de los campos que faltaban al generarlo', async () => {
    const freshUser = await prisma.user.upsert({
      where: { email: 'test-report-incomplete@example.com' },
      update: {},
      create: { email: 'test-report-incomplete@example.com', password: 'no-se-usa-en-este-test' },
    });

    await taxProfileService.upsertProfile(freshUser.id, TEST_YEAR, { ingresosBrutos: 20000000 });
    const report = await reportService.generateReport(freshUser.id, TEST_YEAR);

    assert.ok(report.camposFaltantes.includes('patrimonio bruto a 31 de diciembre'));

    await prisma.report.deleteMany({ where: { userId: freshUser.id } });
    await prisma.taxProfile.deleteMany({ where: { userId: freshUser.id } });
    await prisma.user.delete({ where: { id: freshUser.id } });
  });

  it('lanza un error controlado si no hay perfil para ese usuario y año', async () => {
    const emptyUser = await prisma.user.upsert({
      where: { email: 'test-report-empty@example.com' },
      update: {},
      create: { email: 'test-report-empty@example.com', password: 'no-se-usa-en-este-test' },
    });

    await assert.rejects(
      () => reportService.generateReport(emptyUser.id, TEST_YEAR),
      (err) => err.status === 400
    );

    await prisma.user.delete({ where: { id: emptyUser.id } });
  });
});
