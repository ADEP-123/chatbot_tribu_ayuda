const { runTurn } = require('../src/services/llm.service');

const cases = [
  {
    label: 'Ingreso mensual promedio',
    message: 'Hola, gano como 6 millones al mes y no tengo carro ni casa propia',
    expectField: 'ingresosBrutos',
    expectValue: 72000000,
  },
  {
    label: 'Gasto de un mes puntual (NO debe extraer nada aún)',
    message: 'gasté 900 mil en tarjeta el mes pasado',
    expectField: null,
  },
  {
    label: 'Consignaciones anuales explícitas',
    message: 'en el año consigné como 40 millones',
    expectField: 'consignaciones',
    expectValue: 40000000,
  },
  {
    label: 'Mensaje sin cifras (NO debe extraer nada)',
    message: 'Dame el total exacto del año',
    expectField: null,
  },
  {
    label: 'Respuesta booleana sin cifras',
    message: 'no soy responsable de iva',
    expectField: 'esResponsableIva',
    expectValue: false,
  },
];

async function main() {
  console.log(`Modelo: ${process.env.OLLAMA_MODEL}\n`);
  let passed = 0;

  for (const c of cases) {
    const { reply, extractedFields } = await runTurn({
      history: [{ role: 'user', content: c.message }],
      knownProfile: {},
    });

    const ok =
      c.expectField === null
        ? Object.keys(extractedFields).length === 0
        : extractedFields[c.expectField] === c.expectValue;

    console.log(`${ok ? '✅' : '❌'} ${c.label}`);
    console.log(`   mensaje: "${c.message}"`);
    console.log(`   extraído: ${JSON.stringify(extractedFields)}`);
    console.log(`   respuesta: ${reply.slice(0, 90)}...\n`);
    if (ok) passed++;
  }

  console.log(`${passed}/${cases.length} casos correctos`);
}

main().catch(console.error);
