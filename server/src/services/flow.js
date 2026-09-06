const NAME_QUESTION =
  'Hola, soy tu asistente para armar una recomendación sobre tu declaración de renta. ' +
  'Antes de empezar: esto es una recomendación orientativa, no un documento legal — ' +
  'te recomiendo mucho revisarlo con un contador o profesional tributario antes de declarar. ' +
  'Para arrancar, ¿cómo te llamas?';

const FLOW_STEPS = {
  ingresosBrutos: {
    type: 'money',
    question:
      '¿Cuánto ganaste en TOTAL durante todo el año pasado (sumando los 12 meses)? ' +
      'Si no sabes el total exacto, dime cuánto ganas en promedio al mes y yo calculo el año.',
    clarification: 'Necesito una cifra en pesos, aunque sea aproximada. ¿Me das un número?',
  },
  patrimonioBruto: {
    type: 'money_single',
    question:
      'Ahora hablemos de tus bienes: casa, vehículos, ahorros, inversiones... ' +
      '¿Cuál es el valor total aproximado de todo lo que tienes, sumado?',
    clarification:
      'Necesito un valor aproximado en pesos del total de tus bienes. ¿Me das un número, aunque sea estimado?',
  },
  consumosTarjeta: {
    type: 'money',
    question: '¿Cuánto gastaste en TOTAL con tarjeta de crédito durante todo el año pasado?',
    clarification: 'Necesito el total del año en pesos. ¿Me das una cifra aproximada?',
  },
  comprasConsumos: {
    type: 'money',
    question:
      'Sin contar la tarjeta de crédito, ¿a cuánto suman en total tus demás compras y consumos del año?',
    clarification:
      'Necesito el total del año en pesos, sin contar la tarjeta. ¿Me das una cifra aproximada?',
  },
  consignaciones: {
    type: 'money',
    question:
      '¿Cuánto te consignaron o depositaron en TOTAL durante todo el año pasado (sueldo, transferencias, ahorros, etc.)?',
    clarification: 'Necesito el total del año en pesos. ¿Me das una cifra aproximada?',
  },
  esResponsableIva: {
    type: 'boolean',
    question:
      '¿Eres responsable de IVA? Es decir, ¿cobras IVA en facturas por tu actividad económica?',
    clarification: 'Solo necesito un sí o un no. ¿Eres responsable de IVA?',
  },
};

const FLOW_ORDER = [
  'ingresosBrutos',
  'patrimonioBruto',
  'consumosTarjeta',
  'comprasConsumos',
  'consignaciones',
  'esResponsableIva',
];

module.exports = { NAME_QUESTION, FLOW_STEPS, FLOW_ORDER };
