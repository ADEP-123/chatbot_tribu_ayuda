const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
const MODEL = process.env.OLLAMA_MODEL;

const MONEY_TOOL = {
  type: 'function',
  function: {
    name: 'record_answer',
    description: 'Registra la respuesta del usuario a la pregunta que se le hizo.',
    parameters: {
      type: 'object',
      properties: {
        esSuficiente: {
          type: 'boolean',
          description:
            'true si la respuesta da una cifra utilizable, false si es ambigua, vaga o no responde la pregunta',
        },
        monto: {
          type: 'number',
          description: 'El monto en pesos colombianos. Solo si esSuficiente es true.',
        },
        periodicidad: {
          type: 'string',
          enum: ['anual', 'mensual'],
          description:
            'Si el monto es el total del año o un promedio mensual. Solo si esSuficiente es true.',
        },
      },
      required: ['esSuficiente'],
    },
  },
};

const MONEY_SINGLE_TOOL = {
  type: 'function',
  function: {
    name: 'record_answer',
    description: 'Registra la respuesta del usuario a la pregunta que se le hizo.',
    parameters: {
      type: 'object',
      properties: {
        esSuficiente: {
          type: 'boolean',
          description: 'true si la respuesta da un valor utilizable, false si es ambigua o vaga',
        },
        monto: {
          type: 'number',
          description: 'El valor total en pesos colombianos. Solo si esSuficiente es true.',
        },
      },
      required: ['esSuficiente'],
    },
  },
};

const BOOLEAN_TOOL = {
  type: 'function',
  function: {
    name: 'record_answer',
    description: 'Registra la respuesta del usuario a la pregunta que se le hizo.',
    parameters: {
      type: 'object',
      properties: {
        esSuficiente: {
          type: 'boolean',
          description:
            'true si la respuesta es claramente afirmativa o negativa, false si es ambigua',
        },
        valor: {
          type: 'boolean',
          description:
            'true si la respuesta es afirmativa, false si es negativa. Solo si esSuficiente es true.',
        },
      },
      required: ['esSuficiente'],
    },
  },
};

function toolForType(type) {
  if (type === 'money') return MONEY_TOOL;
  if (type === 'money_single') return MONEY_SINGLE_TOOL;
  if (type === 'boolean') return BOOLEAN_TOOL;
  throw new Error(`Tipo de paso desconocido: ${type}`);
}

// Ollama a veces devuelve booleanos y números como strings ("false", "40000000")
// en vez de tipos nativos — normalizamos siempre, sin asumir el tipo que llegó.
function coerceBoolean(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.trim().toLowerCase() === 'true';
  return Boolean(v);
}

function coerceNumber(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function normalizeResult(raw) {
  const result = { esSuficiente: coerceBoolean(raw.esSuficiente) };
  if (raw.monto !== undefined) result.monto = coerceNumber(raw.monto);
  if (raw.periodicidad !== undefined) result.periodicidad = raw.periodicidad;
  if (raw.valor !== undefined) result.valor = coerceBoolean(raw.valor);
  return result;
}

async function callOllama(systemPrompt, userMessage, tool) {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      tools: [tool],
      stream: false,
      options: { temperature: 0.1 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Ollama respondió con error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function extractStepAnswer(step, userMessage) {
  const systemPrompt = `Analiza la respuesta del usuario a esta pregunta que se le hizo: "${step.question}"

Reglas:
- Convierte expresiones coloquiales a su valor numérico completo: "6 millones" = 6000000, "800 mil" = 800000, "1.2 millones" = 1200000.
- Si el usuario da una cifra clara (preguntas de dinero) o un sí/no claro (preguntas de sí o no), esSuficiente SIEMPRE debe ser true, aunque la cifra sea aproximada.
- Solo marca esSuficiente en false si el usuario realmente no dio ninguna respuesta utilizable (ej. "no sé", "no tengo idea").
- Nunca inventes un valor que el usuario no haya dado.

Llama siempre a record_answer con tu análisis.`;

  const { message } = await callOllama(systemPrompt, userMessage, toolForType(step.type));
  const call = message.tool_calls?.[0];

  if (!call || call.function.name !== 'record_answer') {
    return { esSuficiente: false };
  }

  const rawArgs =
    typeof call.function.arguments === 'string'
      ? JSON.parse(call.function.arguments)
      : call.function.arguments;

  return normalizeResult(rawArgs);
}

module.exports = { extractStepAnswer };
