const assert = require('node:assert');
const prisma = require('../src/db');
const { resetUserData } = require('../src/utils/resetUserData');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TEST_EMAIL = 'e2e-test@example.com';
const TEST_PASSWORD = 'E2ePassword1!';
const YEAR = 2025; // debe existir un TaxYear sembrado para este año

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function getAuthToken() {
  let res = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, name: 'E2E Test' }),
  });

  if (res.status === 409) {
    res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
  }

  assert.ok(res.body?.token, `No se pudo autenticar: ${JSON.stringify(res.body)}`);
  return res.body.token;
}

async function sendMessage(token, conversationId, content) {
  const { status, body } = await api(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  assert.strictEqual(status, 200, `Fallo enviando mensaje: ${JSON.stringify(body)}`);
  return body;
}

const STEP_ANSWERS = {
  name: 'Andrés',
  ingresosBrutos: 'gano 6 millones al mes',
  patrimonioBruto: 'en total tengo unos 40 millones entre carro y ahorros',
  consumosTarjeta: 'no he usado tarjeta este año',
  comprasConsumos: 'ninguna otra compra grande',
  consignaciones: 'en el año consigné 40 millones',
  esResponsableIva: 'no soy responsable de iva',
};

async function main() {
  console.log('--- Reiniciando datos del usuario de prueba ---');
  await resetUserData(TEST_EMAIL);
  await prisma.user.update({ where: { email: TEST_EMAIL }, data: { name: null } }).catch(() => {});

  console.log('--- Autenticando ---');
  const token = await getAuthToken();

  console.log('--- Creando conversación (debe traer la pregunta del nombre) ---');
  const { status, body: conversation } = await api('/api/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(status, 201);
  assert.match(conversation.messages[0].content, /cómo te llamas/i);
  const conversationId = conversation.id;

  let currentStep = 'name';
  let lastResult;
  const MAX_TURNS = 20; // margen amplio para absorber vueltas de aclaración
  let turns = 0;

  while (currentStep !== 'complete' && turns < MAX_TURNS) {
    const answer = STEP_ANSWERS[currentStep];
    assert.ok(answer, `No hay respuesta de prueba definida para el paso "${currentStep}"`);

    console.log(`--- [${currentStep}] Enviando: "${answer}" ---`);
    lastResult = await sendMessage(token, conversationId, answer);
    console.log(
      `   extraído: ${JSON.stringify(lastResult.extracted)} | siguiente paso: ${lastResult.nextStep}`
    );

    currentStep = lastResult.nextStep;
    turns++;
  }

  assert.strictEqual(
    currentStep,
    'complete',
    `El flujo no llegó a "complete" tras ${MAX_TURNS} turnos (se quedó en "${currentStep}")`
  );

  console.log('--- Generando reporte ---');
  const { status: reportStatus, body: report } = await api(`/api/reports/${YEAR}/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(reportStatus, 201);
  assert.strictEqual(report.debeDeclarar, true);

  console.log(
    `\n✅ Flujo guiado completo en ${turns} turnos (incluyendo posibles aclaraciones). Reporte generado.`
  );
}

main()
  .catch((err) => {
    console.error('\n❌ Falló el test end-to-end:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
