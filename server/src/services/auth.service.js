const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

async function register({ email, password, name }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const error = new Error('Ya existe una cuenta con ese correo');
    error.status = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  return buildAuthResponse(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error('Credenciales inválidas');
    error.status = 401;
    throw error;
  }

  return buildAuthResponse(user);
}

function buildAuthResponse(user) {
  const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, JWT_SECRET, {
    expiresIn: '7d',
  });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
  };
}

module.exports = { register, login };
