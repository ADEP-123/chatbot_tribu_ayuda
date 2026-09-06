const prisma = require('../db');
const { NAME_QUESTION, FLOW_STEPS, FLOW_ORDER } = require('./flow');
const { extractStepAnswer, interpretCorrection, FIELD_LABELS } = require('./stepExtractor.service');
const taxProfileService = require('./taxProfile.service');

const NEGATIVE_ZERO_PATTERN =
  /\b(no\s+(he|tengo|tuve|gast[eé]|us[eé]|consign[eé]|recib[ií])|nada|ninguno|ninguna|\bcero\b)/i;
const SIMPLE_YES_PATTERN = /^\s*s[ií]!?\.?\s*$/i;
const SIMPLE_NO_PATTERN = /^\s*no!?\.?\s*$/i;

function isNegativeZeroAnswer(content) {
  return NEGATIVE_ZERO_PATTERN.test(content) && !/\d/.test(content);
}

function isSimpleYesNo(content) {
  if (SIMPLE_YES_PATTERN.test(content)) return true;
  if (SIMPLE_NO_PATTERN.test(content)) return false;
  return undefined;
}

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

function getConversationsForUser(userId) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

function annualizeMoney(result) {
  if (!Number.isFinite(result.monto) || result.monto < 0) return null;
  return result.periodicidad === 'mensual' ? result.monto * 12 : result.monto;
}

async function handleTaxStep(userId, taxYear, step, content) {
  const stepDef = FLOW_STEPS[step];

  // Atajo determinista para sí/no simples — evita depender del modelo en el caso
  // más trivial posible, que hemos visto fallar de forma repetida y consistente.
  if (stepDef.type === 'boolean') {
    const simple = isSimpleYesNo(content);
    if (simple !== undefined) {
      await taxProfileService.upsertProfile(userId, taxYear.year, { [step]: simple });
      const nextStep = await getCurrentStep(userId);
      return { reply: questionForStep(nextStep), extracted: { [step]: simple }, nextStep };
    }
  }

  // Atajo determinista para negaciones de montos ("no he usado tarjeta") — mismo principio.
  if (
    (stepDef.type === 'money' || stepDef.type === 'money_single') &&
    isNegativeZeroAnswer(content)
  ) {
    await taxProfileService.upsertProfile(userId, taxYear.year, { [step]: 0 });
    const nextStep = await getCurrentStep(userId);
    return { reply: questionForStep(nextStep), extracted: { [step]: 0 }, nextStep };
  }

  const result = await extractStepAnswer(stepDef, content);

  if (!result.esSuficiente) {
    return { reply: stepDef.clarification, extracted: null };
  }

  let value;
  if (stepDef.type === 'boolean') {
    value = typeof result.valor === 'boolean' ? result.valor : null;
  } else if (stepDef.type === 'money_single') {
    value = Number.isFinite(result.monto) && result.monto >= 0 ? result.monto : null;
  } else {
    value = annualizeMoney(result);
  }

  if (value === null) {
    return { reply: stepDef.clarification, extracted: null };
  }

  await taxProfileService.upsertProfile(userId, taxYear.year, { [step]: value });
  const nextStep = await getCurrentStep(userId);

  return { reply: questionForStep(nextStep), extracted: { [step]: value }, nextStep };
}

async function handleCompleteStep(userId, taxYear, content) {
  const wantsReport = /generar|reporte/i.test(content);
  if (wantsReport) {
    return {
      reply:
        'Perfecto, dale clic al botón "Generar mi reporte" que aparece arriba del chat para verlo.',
      extracted: null,
      nextStep: 'complete',
    };
  }

  const correction = await interpretCorrection(content);

  if (!correction.esCorreccion || !correction.campo || !FLOW_STEPS[correction.campo]) {
    return { reply: questionForStep('complete'), extracted: null, nextStep: 'complete' };
  }

  const stepDef = FLOW_STEPS[correction.campo];
  let value;
  if (stepDef.type === 'boolean') {
    value = typeof correction.valorBooleano === 'boolean' ? correction.valorBooleano : null;
  } else if (stepDef.type === 'money_single') {
    value = Number.isFinite(correction.monto) && correction.monto >= 0 ? correction.monto : null;
  } else {
    value = annualizeMoney(correction);
  }

  if (value === null || value === undefined) {
    return {
      reply: 'No logré identificar el nuevo valor. ¿Puedes darlo de nuevo, con una cifra concreta?',
      extracted: null,
      nextStep: 'complete',
    };
  }

  await taxProfileService.upsertProfile(userId, taxYear.year, { [correction.campo]: value });
  return {
    reply: `Listo, actualicé "${FIELD_LABELS[correction.campo]}". ¿Quieres corregir algo más, o generamos el reporte?`,
    extracted: { [correction.campo]: value },
    nextStep: 'complete',
  };
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
    result = { reply: questionForStep(nextStep), extracted: { name }, nextStep };
  } else if (step === 'complete') {
    const taxYear = await getCurrentTaxYear();
    result = await handleCompleteStep(userId, taxYear, content);
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
    nextStep: result.nextStep || step,
    extracted: result.extracted,
    profileComplete: (result.nextStep || step) === 'complete',
  };
}

async function deleteConversation(id, userId) {
  const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
  if (!conversation) {
    const error = new Error('Conversación no encontrada');
    error.status = 404;
    throw error;
  }
  await prisma.conversation.delete({ where: { id } });
}

module.exports = {
  createConversation,
  getConversation,
  getConversationsForUser,
  sendMessage,
  isNegativeZeroAnswer,
  isSimpleYesNo,
  deleteConversation,
};
