const taxProfileService = require('../services/taxProfile.service');
const taxRulesService = require('../services/taxRules.service');
const prisma = require('../db');

async function upsertProfile(req, res, next) {
  try {
    const profile = await taxProfileService.upsertProfile(
      req.user.userId,
      req.params.year,
      req.body
    );
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await taxProfileService.getProfile(req.user.userId, req.params.year);
    if (!profile)
      return res.status(404).json({ error: 'Aún no tienes datos registrados para este año' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function getObligation(req, res, next) {
  try {
    const { year } = req.params;
    const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
    if (!taxYear) return res.status(404).json({ error: 'Año gravable no configurado' });

    const profile = await taxProfileService.getProfile(req.user.userId, year);
    if (!profile)
      return res.status(404).json({ error: 'Aún no tienes datos registrados para este año' });

    res.json(taxRulesService.evaluateObligation(profile, taxYear));
  } catch (err) {
    next(err);
  }
}

module.exports = { upsertProfile, getProfile, getObligation };
