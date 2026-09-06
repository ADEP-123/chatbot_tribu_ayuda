const express = require('express');
const controller = require('../controllers/report.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
router.post('/:year/generate', requireAuth, controller.generate);
router.get('/', requireAuth, controller.getAll);
router.get('/:id', requireAuth, controller.getOne);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
