require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const scanRoutes = require('./routes/scan');
const calculateRoutes = require('./routes/calculate');

const pawnDecisionRoutes = require('./routes/pawnDecision');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(generalLimiter);

app.get('/', (req, res) => {
  res.json({
    message: 'Pegadaian Pricing Analytics API',
    version: '2.0.0',
    phase: 'PoC',
    flow: 'SCAN → FORM (editable) → TAKSIR HARGA (editable)',
    endpoints: {
      scan: {
        slik: 'POST /api/scan/slik',
        salary_slip: 'POST /api/scan/salary-slip',
        vehicle: 'POST /api/scan/vehicle'
      },
      calculate: {
        pricing: 'POST /api/calculate/pricing',
        pawn: 'POST /api/calculate/pawn',
        full_assessment: 'POST /api/calculate/full-assessment'
      },
      pawn_simulation: '/api/pawn-decision'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/scan', scanRoutes);
app.use('/api/calculate', calculateRoutes);

app.use('/api/pawn-decision', pawnDecisionRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Pegadaian Pricing Analytics API running on port ${PORT}`);
});

