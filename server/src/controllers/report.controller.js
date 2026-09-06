const reportService = require('../services/report.service');

async function generate(req, res, next) {
  try {
    res.status(201).json(await reportService.generateReport(req.user.userId, req.params.year));
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    res.json(await reportService.getReportsForUser(req.user.userId));
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const report = await reportService.getReport(req.params.id, req.user.userId);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });
    res.json(report);
  } catch (err) {
    next(err);
  }
}
async function remove(req, res, next) {
  try {
    await reportService.deleteReport(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, getAll, getOne, remove };
