const JUMP_FACTOR = 3; // si un valor cambia más de 3x de golpe, es sospechoso

function toNum(v) {
  return v === null || v === undefined ? null : Number(v);
}

function filterSuspiciousChanges(extractedFields, currentProfile) {
  const safe = { ...extractedFields };

  for (const field of Object.keys(extractedFields)) {
    const newValue = extractedFields[field];
    const oldValue = toNum(currentProfile?.[field]);

    if (typeof newValue !== 'number') continue;

    // Un valor de 0 "nuevo" cuando antes no había nada es casi siempre una invención del modelo
    if (newValue === 0 && (oldValue === null || oldValue === 0)) {
      delete safe[field];
      continue;
    }

    // Un salto brusco respecto a lo ya guardado es probable error de cálculo del modelo
    if (oldValue && oldValue > 0) {
      const ratio = newValue / oldValue;
      if (ratio > JUMP_FACTOR || ratio < 1 / JUMP_FACTOR) {
        console.warn(
          `[profileGuards] Cambio sospechoso en "${field}": ${oldValue} -> ${newValue}. Se ignora.`
        );
        delete safe[field];
      }
    }
  }

  if (
    safe.comprasConsumos !== undefined &&
    Number(currentProfile?.consumosTarjeta) > 0 &&
    Number(safe.comprasConsumos) === Number(currentProfile.consumosTarjeta)
  ) {
    console.warn(
      '[profileGuards] "comprasConsumos" coincide exactamente con el consumosTarjeta ya guardado — se descarta por posible confusión del modelo.'
    );
    delete safe.comprasConsumos;
  }

  return safe;
}

module.exports = { filterSuspiciousChanges };
