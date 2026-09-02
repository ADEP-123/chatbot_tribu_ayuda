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

function remove(year) {
  return prisma.taxYear.delete({ where: { year: Number(year) } });
}

module.exports = { getAll, getByYear, create, update, remove };
