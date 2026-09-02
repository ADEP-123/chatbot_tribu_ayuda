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

module.exports = { upsertProfile, getProfile };
