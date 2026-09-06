const prisma = require('../db');

async function resetUserData(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  await prisma.message.deleteMany({ where: { conversation: { userId: user.id } } });
  await prisma.conversation.deleteMany({ where: { userId: user.id } });
  await prisma.report.deleteMany({ where: { userId: user.id } });
  await prisma.taxProfile.deleteMany({ where: { userId: user.id } });

  return user;
}

module.exports = { resetUserData };
