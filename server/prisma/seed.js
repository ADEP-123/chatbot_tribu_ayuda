const prisma = require('../src/db');

async function main() {
  const taxYear2025 = await prisma.taxYear.upsert({
    where: { year: 2025 },
    update: {},
    create: {
      year: 2025,
      uvtValue: 49799,
      topePatrimonioUvt: 4500,
      topeIngresosUvt: 1400,
      topeConsumosUvt: 1400,
      topeComprasUvt: 1400,
      topeConsignacionesUvt: 1400,
      sancionMinimaUvt: 10,
      declarationStart: new Date('2026-08-12'),
      declarationEnd: new Date('2026-10-26'),
    },
  });

  console.log('Año gravable 2025 sembrado:', taxYear2025.id);

  const BRACKETS_2025 = [
    { orden: 1, rangoDesdeUvt: 0, rangoHastaUvt: 1090, tarifaMarginal: 0, impuestoBaseUvt: 0 },
    {
      orden: 2,
      rangoDesdeUvt: 1090,
      rangoHastaUvt: 1700,
      tarifaMarginal: 0.19,
      impuestoBaseUvt: 0,
    },
    {
      orden: 3,
      rangoDesdeUvt: 1700,
      rangoHastaUvt: 4100,
      tarifaMarginal: 0.28,
      impuestoBaseUvt: 116,
    },
    {
      orden: 4,
      rangoDesdeUvt: 4100,
      rangoHastaUvt: 8670,
      tarifaMarginal: 0.33,
      impuestoBaseUvt: 788,
    },
    {
      orden: 5,
      rangoDesdeUvt: 8670,
      rangoHastaUvt: 18970,
      tarifaMarginal: 0.35,
      impuestoBaseUvt: 2296,
    },
    {
      orden: 6,
      rangoDesdeUvt: 18970,
      rangoHastaUvt: 31000,
      tarifaMarginal: 0.37,
      impuestoBaseUvt: 5901,
    },
    {
      orden: 7,
      rangoDesdeUvt: 31000,
      rangoHastaUvt: null,
      tarifaMarginal: 0.39,
      impuestoBaseUvt: 10352,
    },
  ];

  for (const bracket of BRACKETS_2025) {
    await prisma.taxBracket.upsert({
      where: { taxYearId_orden: { taxYearId: taxYear2025.id, orden: bracket.orden } },
      update: bracket,
      create: { ...bracket, taxYearId: taxYear2025.id },
    });
  }

  console.log(`${BRACKETS_2025.length} tramos de tarifa sembrados para el año gravable 2025.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
