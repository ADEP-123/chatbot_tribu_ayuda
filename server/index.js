const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { validateEnv } = require('./src/utils/validateEnv');
validateEnv();

const { apiLimiter } = require('./src/middlewares/rateLimit.middleware');
const authRoutes = require('./src/routes/auth.routes');
const taxYearRoutes = require('./src/routes/taxYear.routes');
const taxProfileRoutes = require('./src/routes/taxProfile.routes');
const conversationRoutes = require('./src/routes/conversation.routes');
const reportRoutes = require('./src/routes/report.routes');

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_ORIGIN).split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json({ limit: '100kb' }));
app.use(apiLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/tax-years', taxYearRoutes);
app.use('/api/tax-profiles', taxProfileRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
