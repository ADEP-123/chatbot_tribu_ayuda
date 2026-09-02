const express = require('express');
const controller = require('../controllers/taxYear.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, controller.getAll);
router.get('/:year', requireAuth, controller.getByYear);
router.post('/', requireAuth, requireAdmin, controller.create);
router.put('/:year', requireAuth, requireAdmin, controller.update);
router.delete('/:year', requireAuth, requireAdmin, controller.remove);

module.exports = router;
