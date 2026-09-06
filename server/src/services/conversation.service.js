const prisma = require('../db');
const { NAME_QUESTION, FLOW_STEPS, FLOW_ORDER } = require('./flow');
const { extractStepAnswer } = require('./stepExtractor.service');
const taxProfileService = require('./taxProfile.service');

async function getCurrentTaxYear() {
  const taxYear = await prisma.taxYear.findFirst({ orderBy: { year: 'desc' } });
  if (!taxYear) {
    const error = new Error('No hay ningún año gravable configurado en el sistema');
    error.status = 500;
    throw error;
  }
  return taxYear;
}

async function getCurrentStep(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.name) return 'name';

  const taxYear = await getCurrentTaxYear();
  const profile = await taxProfileService.getProfile(userId, taxYear.year);
  const missing = taxProfileService.getMissingFields(profile);
  const nextField = FLOW_ORDER.find((field) => missing.some((m) => m.field === field));

  return nextField || 'complete';
}

function questionForStep(step) {
  if (step === 'name') return NAME_QUESTION;
  if (step === 'complete') {
    return '¡Listo! Ya tengo todo lo que necesito. ¿Quieres agregar o corregir algo, o generamos tu reporte? (escribe "generar reporte" cuando estés listo)';
  }
  return FLOW_STEPS[step].question;
}

async function createConversation(userId) {
  const conversation = await prisma.conversation.create({ data: { userId } });
  const step = await getCurrentStep(userId);

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'assistant', content: questionForStep(step) },
  });

  return getConversation(conversation.id, userId);
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

function annualizeMoney(result) {
  if (!Number.isFinite(result.monto) || result.monto < 0) return null;
  return result.periodicidad === 'mensual' ? result.monto * 12 : result.monto;
}

async function handleTaxStep(userId, taxYear, step, content) {
  const result = await extractStepAnswer(FLOW_STEPS[step], content);

  if (!result.esSuficiente) {
    return { reply: FLOW_STEPS[step].clarification, extracted: null };
  }

  let value;
  if (FLOW_STEPS[step].type === 'boolean') {
    value = typeof result.valor === 'boolean' ? result.valor : null;
  } else if (FLOW_STEPS[step].type === 'money_single') {
    value = Number.isFinite(result.monto) && result.monto >= 0 ? result.monto : null;
  } else {
    value = annualizeMoney(result);
  }

  if (value === null) {
    return { reply: FLOW_STEPS[step].clarification, extracted: null };
  }

  await taxProfileService.upsertProfile(userId, taxYear.year, { [step]: value });
  const nextStep = await getCurrentStep(userId);

  return { reply: questionForStep(nextStep), extracted: { [step]: value }, nextStep };
}

async function sendMessage(conversationId, userId, content) {
  await getConversation(conversationId, userId); // valida pertenencia
  await prisma.message.create({ data: { conversationId, role: 'user', content } });

  const step = await getCurrentStep(userId);
  let result;

  if (step === 'name') {
    const name = content.trim().slice(0, 100);
    await prisma.user.update({ where: { id: userId }, data: { name } });
    const nextStep = await getCurrentStep(userId);
    result = { reply: questionForStep(nextStep), extracted: { name } };
  } else if (step === 'complete') {
    const wantsReport = /generar|reporte|listo/i.test(content);
    result = wantsReport
      ? {
          reply: 'Perfecto, genera tu reporte con POST /api/reports/:year/generate.',
          extracted: null,
        }
      : { reply: questionForStep('complete'), extracted: null };
  } else {
    const taxYear = await getCurrentTaxYear();
    result = await handleTaxStep(userId, taxYear, step, content);
  }

  await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: result.reply,
      extractedData: result.extracted || undefined,
    },
  });

  return {
    reply: result.reply,
    step,
    extracted: result.extracted,
    profileComplete: (result.nextStep || step) === 'complete',
  };
}

module.exports = { createConversation, getConversation, sendMessage };
