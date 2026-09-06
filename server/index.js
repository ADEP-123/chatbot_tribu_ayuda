const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const taxYearRoutes = require('./src/routes/taxYear.routes');
const taxProfileRoutes = require('./src/routes/taxProfile.routes');
const conversationRoutes = require('./src/routes/conversation.routes');
const reportRoutes = require('./src/routes/report.routes');

const app = express();
app.use(cors());
app.use(express.json());

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
