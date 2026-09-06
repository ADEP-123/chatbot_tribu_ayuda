const prisma = require('../db');
const taxRulesService = require('./taxRules.service');
const taxProfileService = require('./taxProfile.service');

async function generateReport(userId, year) {
  const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
  if (!taxYear) {
    const error = new Error('Año gravable no configurado');
    error.status = 400;
    throw error;
  }

  const taxProfile = await taxProfileService.getProfile(userId, year);
  if (!taxProfile) {
    const error = new Error('Aún no tienes datos registrados para este año');
    error.status = 400;
    throw error;
  }

  const missingFields = taxProfileService.getMissingFields(taxProfile);
  const evaluation = taxRulesService.evaluateObligation(taxProfile, taxYear);

  const report = await prisma.report.create({
    data: {
      userId,
      taxProfileId: taxProfile.id,
      debeDeclarar: evaluation.debeDeclarar,
      motivos: evaluation.motivos,
      camposFaltantes: missingFields.map((f) => f.label),
      fechaLimite: evaluation.debeDeclarar ? taxYear.declarationEnd : null,
    },
  });

  return { ...report, criterios: evaluation.criterios };
}

function getReport(reportId, userId) {
  return prisma.report.findFirst({ where: { id: reportId, userId } });
}

function getReportsForUser(userId) {
  return prisma.report.findMany({ where: { userId }, orderBy: { generatedAt: 'desc' } });
}

module.exports = { generateReport, getReport, getReportsForUser };
