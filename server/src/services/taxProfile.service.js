const prisma = require('../db');

async function upsertProfile(userId, year, data) {
  const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
  if (!taxYear) {
    const error = new Error('Año gravable no configurado en el sistema');
    error.status = 400;
    throw error;
  }

  return prisma.taxProfile.upsert({
    where: { userId_taxYearId: { userId, taxYearId: taxYear.id } },
    update: data,
    create: { ...data, userId, taxYearId: taxYear.id },
  });
}

async function getProfile(userId, year) {
  const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
  if (!taxYear) return null;

  return prisma.taxProfile.findUnique({
    where: { userId_taxYearId: { userId, taxYearId: taxYear.id } },
  });
}

const REQUIRED_FIELDS = [
  { field: 'ingresosBrutos', label: 'ingresos brutos del año' },
  { field: 'patrimonioBruto', label: 'patrimonio bruto a 31 de diciembre' },
  { field: 'consumosTarjeta', label: 'consumos con tarjeta de crédito' },
  { field: 'comprasConsumos', label: 'compras y consumos totales' },
  { field: 'consignaciones', label: 'consignaciones y depósitos' },
  { field: 'esResponsableIva', label: 'si eres responsable de IVA' },
];

function getMissingFields(profile) {
  if (!profile) return REQUIRED_FIELDS;
  return REQUIRED_FIELDS.filter(
    ({ field }) => profile[field] === null || profile[field] === undefined
  );
}

async function resetProfile(userId, year) {
  const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
  if (!taxYear) return;
  await prisma.taxProfile.deleteMany({ where: { userId, taxYearId: taxYear.id } });
}

module.exports = { upsertProfile, getProfile, REQUIRED_FIELDS, getMissingFields, resetProfile };
