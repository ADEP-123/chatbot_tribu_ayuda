const bcrypt = require('bcryptjs');
const prisma = require('../src/db');
const { validatePassword } = require('../src/utils/validators');

const [, , email, password, name] = process.argv;

if (!email || !password) {
  console.error(
    'Uso: node scripts/createAdmin.js correo@ejemplo.com contraseñaSegura "Nombre opcional"'
  );
  process.exit(1);
}

async function main() {
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    console.error(`Contraseña inválida: ${passwordErrors.join(', ')}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { isAdmin: true, password: hashedPassword, ...(name ? { name } : {}) },
    create: { email, password: hashedPassword, name: name || null, isAdmin: true },
  });

  console.log(`Usuario admin listo: ${user.email} (isAdmin: ${user.isAdmin})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
