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

const FIELD_LABELS = {
  ingresosBrutos: 'ingresos brutos del año',
  patrimonioBruto: 'patrimonio bruto (bienes)',
  consumosTarjeta: 'consumos con tarjeta de crédito',
  comprasConsumos: 'compras y consumos totales',
  consignaciones: 'consignaciones y depósitos',
  esResponsableIva: 'si eres responsable de IVA',
};

const CORRECTION_TOOL = {
  type: 'function',
  function: {
    name: 'record_correction',
    description:
      'Identifica si el usuario quiere corregir un dato ya registrado, y con qué nuevo valor.',
    parameters: {
      type: 'object',
      properties: {
        esCorreccion: {
          type: 'boolean',
          description: 'true si el mensaje pide corregir o cambiar un dato existente',
        },
        campo: {
          type: 'string',
          enum: Object.keys(FIELD_LABELS),
          description: 'Cuál de los datos quiere corregir. Solo si esCorreccion es true.',
        },
        monto: {
          type: 'number',
          description: 'El nuevo valor en pesos, si el campo es monetario.',
        },
        periodicidad: {
          type: 'string',
          enum: ['anual', 'mensual'],
          description: 'Si el monto es el total del año o un promedio mensual.',
        },
        valorBooleano: {
          type: 'boolean',
          description: 'El nuevo valor, solo si el campo es "si eres responsable de IVA".',
        },
      },
      required: ['esCorreccion'],
    },
  },
};

function toolForType(type) {
  if (type === 'money') return MONEY_TOOL;
  if (type === 'money_single') return MONEY_SINGLE_TOOL;
  if (type === 'boolean') return BOOLEAN_TOOL;
  throw new Error(`Tipo de paso desconocido: ${type}`);
}

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

const TYPE_EXAMPLES = {
  money:
    '\nEjemplos: "6 millones al mes" → esSuficiente true, monto 6000000, periodicidad mensual. ' +
    '"no he tenido/gastado/usado eso" o "nada" → esSuficiente true, monto 0. ' +
    '"no sé cuánto" → esSuficiente false.',
  money_single:
    '\nEjemplos: "unos 40 millones en total" → esSuficiente true, monto 40000000. ' +
    '"no tengo bienes" o "nada" → esSuficiente true, monto 0. ' +
    '"no tengo idea" → esSuficiente false.',
  boolean:
    '\nEjemplos: "no soy responsable de iva" → esSuficiente true, valor false. ' +
    '"sí, facturo con iva" → esSuficiente true, valor true. ' +
    '"no sé qué es eso" → esSuficiente false.',
};

function normalizeResult(raw) {
  const result = { esSuficiente: coerceBoolean(raw.esSuficiente) };
  if (raw.monto !== undefined) result.monto = coerceNumber(raw.monto);
  if (raw.periodicidad !== undefined) result.periodicidad = raw.periodicidad;
  if (raw.valor !== undefined) result.valor = coerceBoolean(raw.valor);
  return result;
}

async function extractStepAnswer(step, userMessage) {
  const systemPrompt = `Analiza la respuesta del usuario a esta pregunta que se le hizo: "${step.question}"

Reglas:
- Convierte expresiones coloquiales a su valor numérico completo: "6 millones" = 6000000, "800 mil" = 800000, "1.2 millones" = 1200000.
- Si el usuario da una cifra clara, un "no tengo/nada" (que significa 0), o un sí/no claro, esSuficiente SIEMPRE debe ser true.
- Solo marca esSuficiente en false si el usuario realmente no dio ninguna respuesta utilizable (ej. "no sé", "no tengo idea").
- Nunca inventes un valor que el usuario no haya dado.${TYPE_EXAMPLES[step.type] || ''}

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

function normalizeCorrection(raw) {
  const result = { esCorreccion: coerceBoolean(raw.esCorreccion) };
  if (raw.campo !== undefined) result.campo = raw.campo;
  if (raw.monto !== undefined) result.monto = coerceNumber(raw.monto);
  if (raw.periodicidad !== undefined) result.periodicidad = raw.periodicidad;
  if (raw.valorBooleano !== undefined) result.valorBooleano = coerceBoolean(raw.valorBooleano);
  return result;
}

async function interpretCorrection(content) {
  const systemPrompt = `El usuario ya completó un formulario tributario con estos datos: ${Object.values(FIELD_LABELS).join(', ')}.
Analiza si su mensaje pide corregir alguno de esos datos y con qué nuevo valor.
Convierte expresiones coloquiales a su valor numérico completo ("6 millones" = 6000000).
Si el mensaje no pide ninguna corrección (ej. saluda, pregunta algo, o pide generar el reporte), esCorreccion debe ser false.
Llama siempre a record_correction.`;

  const { message } = await callOllama(systemPrompt, content, CORRECTION_TOOL);
  const call = message.tool_calls?.[0];

  if (!call || call.function.name !== 'record_correction') {
    return { esCorreccion: false };
  }

  const rawArgs =
    typeof call.function.arguments === 'string'
      ? JSON.parse(call.function.arguments)
      : call.function.arguments;

  return normalizeCorrection(rawArgs);
}

module.exports = { extractStepAnswer, interpretCorrection, FIELD_LABELS };
