const { resetUserData } = require('../src/utils/resetUserData');
const prisma = require('../src/db');

const email = process.argv[2];

if (!email) {
  console.error('Uso: node prisma/resetTestUser.js correo@ejemplo.com');
  process.exit(1);
}

resetUserData(email)
  .then((user) => {
    if (!user) {
      console.error(`No existe un usuario con el correo ${email}`);
      process.exitCode = 1;
      return;
    }
    console.log(
      `Perfil, conversaciones y reportes de ${email} eliminados. La cuenta sigue existiendo.`
    );
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
