function calculateEstimatedTax(rentaLiquidaGravablePesos, uvtValue, brackets) {
  const uvt = Number(uvtValue);
  const rentaUvt = rentaLiquidaGravablePesos / uvt;

  const sorted = [...brackets].sort((a, b) => Number(a.rangoDesdeUvt) - Number(b.rangoDesdeUvt));
  const bracket = sorted.find(
    (b) =>
      rentaUvt > Number(b.rangoDesdeUvt) &&
      (b.rangoHastaUvt === null || rentaUvt <= Number(b.rangoHastaUvt))
  );

  if (!bracket) return { impuestoUvt: 0, impuestoPesos: 0, tarifaMarginal: 0 };

  const impuestoUvt =
    Number(bracket.impuestoBaseUvt) +
    (rentaUvt - Number(bracket.rangoDesdeUvt)) * Number(bracket.tarifaMarginal);

  return {
    impuestoUvt: Math.max(0, impuestoUvt),
    impuestoPesos: Math.max(0, impuestoUvt) * uvt,
    tarifaMarginal: Number(bracket.tarifaMarginal),
  };
}

module.exports = { calculateEstimatedTax };
