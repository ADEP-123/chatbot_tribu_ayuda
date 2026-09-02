const express = require('express');
const controller = require('../controllers/taxProfile.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/:year', requireAuth, controller.getProfile);
router.put('/:year', requireAuth, controller.upsertProfile);

module.exports = router;
