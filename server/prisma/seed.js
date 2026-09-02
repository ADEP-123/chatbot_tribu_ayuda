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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
