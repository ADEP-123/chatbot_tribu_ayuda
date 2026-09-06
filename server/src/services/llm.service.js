const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const PERIODICIDAD_DESC =
  "'mensual_promedio' si el usuario indicó que ese monto es su promedio o monto típico cada mes (ej. 'gasto como 800 mil al mes en tarjeta'). " +
  "'mes_especifico' si el usuario mencionó el monto de UN mes puntual sin decir que sea representativo (ej. 'el mes pasado gasté 900 mil'). " +
  "'anual' si el usuario ya dio el total del año completo.";

const UPDATE_TAX_PROFILE_TOOL = {
  type: 'function',
  function: {
    name: 'update_tax_profile',
    description:
      'Registra datos tributarios que el usuario mencionó explícitamente. ' +
      'Para montos periódicos, reporta el monto EXACTO que dijo el usuario junto con su periodicidad — nunca hagas tú el cálculo de anualizar. ' +
      'Nunca inventes ni asumas cifras que el usuario no mencionó.',
    parameters: {
      type: 'object',
      properties: {
        ingresos: {
          type: 'object',
          properties: {
            monto: { type: 'number' },
            periodicidad: {
              type: 'string',
              enum: ['mensual_promedio', 'mes_especifico', 'anual'],
              description: PERIODICIDAD_DESC,
            },
          },
          required: ['monto', 'periodicidad'],
        },
        consumosTarjeta: {
          type: 'object',
          properties: {
            monto: { type: 'number' },
            periodicidad: {
              type: 'string',
              enum: ['mensual_promedio', 'mes_especifico', 'anual'],
              description: PERIODICIDAD_DESC,
            },
          },
          required: ['monto', 'periodicidad'],
        },
        comprasConsumos: {
          type: 'object',
          properties: {
            monto: { type: 'number' },
            periodicidad: {
              type: 'string',
              enum: ['mensual_promedio', 'mes_especifico', 'anual'],
              description: PERIODICIDAD_DESC,
            },
          },
          required: ['monto', 'periodicidad'],
        },
        consignaciones: {
          type: 'object',
          properties: {
            monto: { type: 'number' },
            periodicidad: {
              type: 'string',
              enum: ['mensual_promedio', 'mes_especifico', 'anual'],
              description: PERIODICIDAD_DESC,
            },
          },
          required: ['monto', 'periodicidad'],
        },
        patrimonioBruto: {
          type: 'number',
          description:
            'Patrimonio bruto a 31 de diciembre, en pesos. Valor único, nunca lleva periodicidad.',
        },
        esResponsableIva: { type: 'boolean' },
      },
    },
  },
};

const PERIODIC_FIELD_MAP = {
  ingresos: 'ingresosBrutos',
  consumosTarjeta: 'consumosTarjeta',
  comprasConsumos: 'comprasConsumos',
  consignaciones: 'consignaciones',
};

function annualize(monto, periodicidad) {
  if (periodicidad === 'anual') return monto;
  if (periodicidad === 'mensual_promedio') return monto * 12;
  return null; // 'mes_especifico': no hay base suficiente para anualizar con confianza
}

function normalizeToolArgs(rawArgs, userMessage = '') {
  const normalized = {};

  for (const [toolField, profileField] of Object.entries(PERIODIC_FIELD_MAP)) {
    const value = rawArgs[toolField];
    if (value && typeof value.monto === 'number') {
      const annual = annualize(value.monto, value.periodicidad);
      if (annual !== null) normalized[profileField] = annual;
    }
  }

  if (typeof rawArgs.patrimonioBruto === 'number') {
    normalized.patrimonioBruto = rawArgs.patrimonioBruto;
  }

  if (typeof rawArgs.esResponsableIva === 'boolean' && /iva/i.test(userMessage)) {
    normalized.esResponsableIva = rawArgs.esResponsableIva;
  }

  if (
    rawArgs.consumosTarjeta &&
    rawArgs.comprasConsumos &&
    rawArgs.consumosTarjeta.monto === rawArgs.comprasConsumos.monto &&
    rawArgs.consumosTarjeta.periodicidad === rawArgs.comprasConsumos.periodicidad
  ) {
    delete normalized.comprasConsumos;
  }

  return normalized;
}

function formatMoney(v) {
  return `$${Number(v).toLocaleString('es-CO')}`;
}

function buildSystemPrompt(knownProfile = {}) {
  const campo = (v) => (v === null || v === undefined ? 'no proporcionado' : formatMoney(v));
  const iva =
    knownProfile.esResponsableIva === undefined || knownProfile.esResponsableIva === null
      ? 'no proporcionado'
      : knownProfile.esResponsableIva
        ? 'sí'
        : 'no';

  return `Eres un asistente tributario colombiano que ayuda a una persona natural a reunir la información necesaria para saber si debe declarar renta.

Reglas:
- Haz preguntas naturales, una o dos a la vez, en tono cercano y sin jerga legal innecesaria.
- SOLO llama a update_tax_profile con datos que el usuario mencionó EXPLÍCITAMENTE en su último mensaje.
- NUNCA vuelvas a enviar un campo que ya aparece en "Datos que ya conoces" — ya está guardado, no lo repitas ni lo recalcules, así el usuario no lo mencione otra vez.
- NUNCA envíes un valor de 0 o false a menos que el usuario lo haya dicho explícitamente (ej. "no tengo tarjeta", "no soy responsable de IVA"). Si no sabes un dato, simplemente no lo incluyas.
- Nunca calcules tú si debe declarar o no, ni des cifras de topes — eso lo hace un sistema aparte con los datos exactos.
- Si el usuario no sabe un dato exacto, ayúdalo con preguntas simples para estimarlo.
- Si el usuario menciona el monto de un solo mes puntual (periodicidad "mes_especifico"), en tu respuesta pregúntale explícitamente si ese mes fue representativo del resto del año, o si prefiere darte el total exacto del año — no asumas ninguna de las dos cosas.

Ejemplos de cómo clasificar la periodicidad:
- "gano 6 millones al mes" → periodicidad "mensual_promedio"
- "el mes pasado gasté 900 mil en tarjeta" → periodicidad "mes_especifico"
- "en el año consigné 40 millones" → periodicidad "anual"
- "dame tú el total" o "calcúlalo" → NO llames a la herramienta, no hay ninguna cifra nueva; pide el monto exacto de nuevo.

Datos que ya conoces de este usuario (NO los reenvíes, solo son contexto):
- Ingresos brutos: ${campo(knownProfile.ingresosBrutos)}
- Patrimonio bruto: ${campo(knownProfile.patrimonioBruto)}
- Consumos con tarjeta: ${campo(knownProfile.consumosTarjeta)}
- Compras y consumos: ${campo(knownProfile.comprasConsumos)}
- Consignaciones: ${campo(knownProfile.consignaciones)}
- Responsable de IVA: ${iva}`;
}

async function callOllama(messages) {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: [UPDATE_TAX_PROFILE_TOOL],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama respondió con error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function runTurn({ history, knownProfile = {} }) {
  const messages = [{ role: 'system', content: buildSystemPrompt(knownProfile) }, ...history];
  const extractedFields = {};
  const MAX_ITER = 5;

  const lastUserMessage = [...history].reverse().find((m) => m.role === 'user')?.content || '';
  const userMessageHasDigit = /\d/.test(lastUserMessage);

  for (let i = 0; i < MAX_ITER; i++) {
    const { message } = await callOllama(messages);

    // Ningún dato tributario real llega en un mensaje sin cifras — si el modelo
    // intenta extraer algo de todos modos, es una alucinación y la descartamos.
    if (message.tool_calls?.length && !userMessageHasDigit) {
      console.warn(
        '[llm.service] El modelo intentó registrar datos de un mensaje sin cifras numéricas — se ignora.'
      );
      return {
        reply:
          message.content ||
          'Para registrar ese dato necesito una cifra concreta en pesos. ¿Me la puedes dar?',
        extractedFields,
      };
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { reply: message.content, extractedFields };
    }

    messages.push(message);

    for (const call of message.tool_calls) {
      if (call.function.name === 'update_tax_profile') {
        const rawArgs =
          typeof call.function.arguments === 'string'
            ? JSON.parse(call.function.arguments)
            : call.function.arguments;
        Object.assign(extractedFields, normalizeToolArgs(rawArgs, lastUserMessage));
      }
      messages.push({ role: 'tool', content: 'Dato registrado.' });
    }
  }

  return {
    reply: 'Disculpa, tuve un problema procesando eso. ¿Puedes reformular tu mensaje?',
    extractedFields,
  };
}

module.exports = { runTurn };
