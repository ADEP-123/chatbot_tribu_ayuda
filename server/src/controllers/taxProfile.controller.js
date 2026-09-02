const taxProfileService = require('../services/taxProfile.service');

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

module.exports = { upsertProfile, getProfile };
