const prisma = require('../db');

function getAll() {
  return prisma.taxYear.findMany({ orderBy: { year: 'desc' } });
}

function getByYear(year) {
  return prisma.taxYear.findUnique({
    where: { year: Number(year) },
    include: { deadlines: true },
  });
}

function create(data) {
  return prisma.taxYear.create({ data });
}

function update(year, data) {
  return prisma.taxYear.update({ where: { year: Number(year) }, data });
}

async function remove(year) {
  const taxYear = await prisma.taxYear.findUnique({ where: { year: Number(year) } });
  if (!taxYear) {
    const error = new Error('Año gravable no encontrado');
    error.status = 404;
    throw error;
  }

  const profileCount = await prisma.taxProfile.count({ where: { taxYearId: taxYear.id } });
  if (profileCount > 0) {
    const error = new Error(
      `No se puede eliminar: hay ${profileCount} perfil(es) de usuario registrados para el año ${year}. Elimínalos primero si de verdad quieres borrar este año.`
    );
    error.status = 409;
    throw error;
  }

  return prisma.taxYear.delete({ where: { year: Number(year) } });
}

module.exports = { getAll, getByYear, create, update, remove };
