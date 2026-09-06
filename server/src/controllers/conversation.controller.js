const conversationService = require('../services/conversation.service');

async function create(req, res, next) {
  try {
    res.status(201).json(await conversationService.createConversation(req.user.userId));
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    res.json(await conversationService.getConversation(req.params.id, req.user.userId));
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    res.json(await conversationService.sendMessage(req.params.id, req.user.userId, content));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, get, sendMessage };
