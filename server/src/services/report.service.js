const prisma = require('../db');
const taxRulesService = require('./taxRules.service');
const taxProfileService = require('./taxProfile.service');
const { calculateEstimatedTax } = require('./taxCalculator.service');

async function generateReport(userId, year) {
  const taxYear = await prisma.taxYear.findUnique({
    where: { year: Number(year) },
    include: { brackets: true },
  });
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

  let montoEstimado = null;
  if (evaluation.debeDeclarar && taxYear.brackets.length > 0) {
    const { impuestoPesos } = calculateEstimatedTax(
      Number(taxProfile.ingresosBrutos || 0),
      taxYear.uvtValue,
      taxYear.brackets
    );
    montoEstimado = impuestoPesos;
  }

  const report = await prisma.report.create({
    data: {
      userId,
      taxProfileId: taxProfile.id,
      debeDeclarar: evaluation.debeDeclarar,
      motivos: evaluation.motivos,
      camposFaltantes: missingFields.map((f) => f.label),
      fechaLimite: evaluation.debeDeclarar ? taxYear.declarationEnd : null,
      montoEstimado,
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

async function deleteReport(id, userId) {
  const report = await prisma.report.findFirst({ where: { id, userId } });
  if (!report) {
    const error = new Error('Reporte no encontrado');
    error.status = 404;
    throw error;
  }
  await prisma.report.delete({ where: { id } });
}

module.exports = { generateReport, getReport, getReportsForUser, deleteReport };
