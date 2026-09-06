const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const INSECURE_DEFAULTS = ['cambia-esto-por-una-cadena-larga-y-aleatoria', 'secret', 'changeme'];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error(
      'JWT_SECRET es demasiado corto (mínimo 32 caracteres). Genera uno nuevo con:\n' +
        "  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
    process.exit(1);
  }

  if (INSECURE_DEFAULTS.includes(process.env.JWT_SECRET)) {
    console.error(
      'JWT_SECRET sigue siendo el valor de ejemplo. Genera uno nuevo antes de continuar.'
    );
    process.exit(1);
  }
}

module.exports = { validateEnv };
