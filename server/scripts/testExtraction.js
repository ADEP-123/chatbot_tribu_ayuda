const { extractStepAnswer } = require('../src/services/stepExtractor.service');
const { FLOW_STEPS } = require('../src/services/flow');

const cases = [
  {
    step: 'ingresosBrutos',
    message: 'gano 6 millones al mes',
    expect: { esSuficiente: true, value: 72000000 },
  },
  {
    step: 'ingresosBrutos',
    message: 'no sé cuánto gano exactamente',
    expect: { esSuficiente: false },
  },
  {
    step: 'patrimonioBruto',
    message: 'en total tengo unos 40 millones entre carro y ahorros',
    expect: { esSuficiente: true, value: 40000000 },
  },
  {
    step: 'consignaciones',
    message: 'en el año consigné 40 millones',
    expect: { esSuficiente: true, value: 40000000 },
  },
  {
    step: 'esResponsableIva',
    message: 'no soy responsable de iva',
    expect: { esSuficiente: true, value: false },
  },
  { step: 'esResponsableIva', message: 'no sé qué es eso', expect: { esSuficiente: false } },
];

function resolveValue(step, result) {
  if (!result.esSuficiente) return undefined;
  if (FLOW_STEPS[step].type === 'boolean') return result.valor;
  if (FLOW_STEPS[step].type === 'money_single') return result.monto;
  return result.periodicidad === 'mensual' ? result.monto * 12 : result.monto;
}

async function main() {
  console.log(`Modelo: ${process.env.OLLAMA_MODEL}\n`);
  let passed = 0;

  for (const c of cases) {
    const result = await extractStepAnswer(FLOW_STEPS[c.step], c.message);
    const value = resolveValue(c.step, result);
    const ok =
      c.expect.esSuficiente === result.esSuficiente &&
      (c.expect.esSuficiente === false || value === c.expect.value);

    console.log(`${ok ? '✅' : '❌'} [${c.step}] "${c.message}"`);
    console.log(`   resultado: ${JSON.stringify(result)}\n`);
    if (ok) passed++;
  }

  console.log(`${passed}/${cases.length} casos correctos`);
}

main().catch(console.error);
