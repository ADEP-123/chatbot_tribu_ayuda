const express = require('express');
const controller = require('../controllers/conversation.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();
router.post('/', requireAuth, controller.create);
router.get('/:id', requireAuth, controller.get);
router.post('/:id/messages', requireAuth, controller.sendMessage);
router.get('/', requireAuth, controller.getAll);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
