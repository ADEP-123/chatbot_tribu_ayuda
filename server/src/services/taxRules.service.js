const CRITERIOS = [
  {
    key: 'patrimonio',
    campo: 'patrimonioBruto',
    topeCampo: 'topePatrimonioUvt',
    label: 'Patrimonio bruto',
  },
  {
    key: 'ingresos',
    campo: 'ingresosBrutos',
    topeCampo: 'topeIngresosUvt',
    label: 'Ingresos brutos',
  },
  {
    key: 'consumosTarjeta',
    campo: 'consumosTarjeta',
    topeCampo: 'topeConsumosUvt',
    label: 'Consumos con tarjeta de crédito',
  },
  {
    key: 'comprasConsumos',
    campo: 'comprasConsumos',
    topeCampo: 'topeComprasUvt',
    label: 'Compras y consumos totales',
  },
  {
    key: 'consignaciones',
    campo: 'consignaciones',
    topeCampo: 'topeConsignacionesUvt',
    label: 'Consignaciones, depósitos e inversiones',
  },
];

function toNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

function evaluateObligation(taxProfile, taxYear) {
  const uvtValue = toNumber(taxYear.uvtValue);

  const criterios = CRITERIOS.map(({ key, campo, topeCampo, label }) => {
    const valorDeclarado = toNumber(taxProfile[campo]);
    const topeUvt = toNumber(taxYear[topeCampo]);
    const topePesos = topeUvt * uvtValue;
    return {
      criterio: key,
      label,
      valorDeclarado,
      topeUvt,
      topePesos,
      superado: valorDeclarado >= topePesos,
    };
  });

  // Ser responsable de IVA al cierre del año obliga a declarar
  // sin importar si se superó alguno de los topes anteriores.
  criterios.push({
    criterio: 'responsableIva',
    label: 'Responsable de IVA al cierre del año',
    superado: Boolean(taxProfile.esResponsableIva),
  });

  const motivos = criterios.filter((c) => c.superado);

  return {
    taxYear: taxYear.year,
    debeDeclarar: motivos.length > 0,
    criterios,
    motivos,
  };
}

module.exports = { evaluateObligation, CRITERIOS };
