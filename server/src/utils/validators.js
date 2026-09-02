function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string' || password.length < 8) {
    errors.push('Debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Debe contener al menos un símbolo (ej. !@#$%&*)');
  }

  return errors;
}

module.exports = { validatePassword };
