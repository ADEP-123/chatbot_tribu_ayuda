const prisma = require('../db');
const llmService = require('./llm.service');
const taxProfileService = require('./taxProfile.service');
const { filterSuspiciousChanges } = require('../utils/profileGuards');

async function getCurrentTaxYear() {
  const taxYear = await prisma.taxYear.findFirst({ orderBy: { year: 'desc' } });
  if (!taxYear) {
    const error = new Error('No hay ningún año gravable configurado en el sistema');
    error.status = 500;
    throw error;
  }
  return taxYear;
}

function createConversation(userId) {
  return prisma.conversation.create({ data: { userId } });
}

async function getConversation(id, userId) {
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!conversation) {
    const error = new Error('Conversación no encontrada');
    error.status = 404;
    throw error;
  }
  return conversation;
}

async function sendMessage(conversationId, userId, content) {
  const conversation = await getConversation(conversationId, userId);
  const taxYear = await getCurrentTaxYear();

  await prisma.message.create({ data: { conversationId, role: 'user', content } });

  const knownProfile = (await taxProfileService.getProfile(userId, taxYear.year)) || {};
  const history = conversation.messages.map((m) => ({ role: m.role, content: m.content }));
  history.push({ role: 'user', content });

  const { reply, extractedFields } = await llmService.runTurn({ history, knownProfile });

  const safeFields = filterSuspiciousChanges(extractedFields, knownProfile);

  if (Object.keys(safeFields).length > 0) {
    await taxProfileService.upsertProfile(userId, taxYear.year, safeFields);
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: reply,
      extractedData: Object.keys(extractedFields).length ? extractedFields : undefined,
    },
  });

  return { reply, extractedFields: safeFields };
}

module.exports = { createConversation, getConversation, sendMessage };
