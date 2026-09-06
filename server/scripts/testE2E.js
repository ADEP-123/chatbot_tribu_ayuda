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

async function main() {
  console.log('--- Reiniciando datos del usuario de prueba ---');
  await resetUserData(TEST_EMAIL);

  console.log('--- Autenticando ---');
  const token = await getAuthToken();

  console.log('--- Creando conversación ---');
  const { status: convStatus, body: conversation } = await api('/api/conversations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(convStatus, 201);
  const conversationId = conversation.id;

  const turns = [
    { message: 'Hola, gano como 6 millones al mes y no tengo carro ni casa propia', expect: { ingresosBrutos: 72000000 } },
    { message: 'gasté 900 mil en tarjeta el mes pasado', expect: null },
    { message: 'en el año consigné como 40 millones', expect: { consignaciones: 40000000 } },
    { message: 'no soy responsable de iva', expect: { esResponsableIva: false } },
  ];

  for (const turn of turns) {
    console.log(`--- Enviando: "${turn.message}" ---`);
    const result = await sendMessage(token, conversationId, turn.message);
    console.log(`   extraído: ${JSON.stringify(result.extractedFields)}`);
    console.log(`   perfil completo: ${result.profileComplete} | faltan: ${result.missingFields.join(', ') || 'nada'}`);

    if (turn.expect) {
      for (const [field, value] of Object.entries(turn.expect)) {
        assert.strictEqual(
          result.extractedFields[field],
          value,
          `Se esperaba ${field}=${value}, el modelo devolvió ${result.extractedFields[field]}`
        );
      }
    }
  }

  console.log('--- Verificando perfil guardado en la base de datos ---');
  const { status: profileStatus, body: profile } = await api(`/api/tax-profiles/${YEAR}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(profileStatus, 200);
  assert.strictEqual(Number(profile.ingresosBrutos), 72000000);
  assert.strictEqual(Number(profile.consignaciones), 40000000);

  console.log('--- Generando reporte ---');
  const { status: reportStatus, body: report } = await api(`/api/reports/${YEAR}/generate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(reportStatus, 201);
  assert.strictEqual(report.debeDeclarar, true);
  assert.ok(report.motivos.some((m) => m.criterio === 'ingresos'));

  console.log('\n✅ Flujo end-to-end completo: registro, login, conversación, extracción, perfil y reporte.');
}

main()
  .catch((err) => {
    console.error('\n❌ Falló el test end-to-end:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());