const taxYearService = require('../services/taxYear.service');

async function getAll(req, res, next) {
  try {
    res.json(await taxYearService.getAll());
  } catch (err) {
    next(err);
  }
}

async function getByYear(req, res, next) {
  try {
    const taxYear = await taxYearService.getByYear(req.params.year);
    if (!taxYear) return res.status(404).json({ error: 'Año gravable no encontrado' });
    res.json(taxYear);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    res.status(201).json(await taxYearService.create(req.body));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.json(await taxYearService.update(req.params.year, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await taxYearService.remove(req.params.year);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getByYear, create, update, remove };
