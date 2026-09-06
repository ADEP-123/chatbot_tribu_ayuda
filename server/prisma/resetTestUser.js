const prisma = require('../src/db');

const TEST_EMAIL = process.argv[2];

if (!TEST_EMAIL) {
  console.error('Uso: node prisma/resetTestUser.js correo@ejemplo.com');
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) {
    console.error(`No existe un usuario con el correo ${TEST_EMAIL}`);
    process.exit(1);
  }

  await prisma.message.deleteMany({ where: { conversation: { userId: user.id } } });
  await prisma.conversation.deleteMany({ where: { userId: user.id } });
  await prisma.report.deleteMany({ where: { userId: user.id } });
  await prisma.taxProfile.deleteMany({ where: { userId: user.id } });

  console.log(
    `Perfil, conversaciones y reportes de ${TEST_EMAIL} eliminados. La cuenta sigue existiendo.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
