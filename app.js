// Load dotenvx to decrypt and inject environment variables from encrypted .env
const { config } = require('@dotenvx/dotenvx');
config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serving static files (uploads directory)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Setup Sequelize instance with environment variables and SSL settings
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    },
    logging: false,
  }
);

// Sync Sequelize models
sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ All models synced to the database');
  })
  .catch((err) => {
    console.error('❌ Error syncing models:', err);
  });

// Import API routes
const onboardingRoutes = require('./routes/onboardingRoutes');
const demographicsRoutes = require('./routes/demographicsRoutes');
const confounderRoutes = require('./routes/confounderRoutes');
const oralCancerRoutes = require('./routes/oralCancerRoutes');
const larynxRoutes = require('./routes/larynxRoutes');
const pharynxRoutes = require('./routes/pharynxRoutes');
const voiceRecordingRoutes = require('./routes/voiceRecordingRoutes');
const grbasRoutes = require('./routes/grbasRoutes');
const sessionProgressRoutes = require('./routes/sessionProgressRoutes');
const vhiRoutes = require('./routes/vhiroutes');

// Register API routes
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/demographics', demographicsRoutes);
app.use('/api/oral-cancer', oralCancerRoutes);
app.use('/api/larynx', larynxRoutes);
app.use('/api/confounder', confounderRoutes);
app.use('/api/pharynx', pharynxRoutes);
app.use('/api/voice-recordings', voiceRecordingRoutes);
app.use('/api/grbas', grbasRoutes);
app.use('/api/session-progress', sessionProgressRoutes);
app.use('/api/vhi', vhiRoutes);

// Optional: Add a simple route at root for health checks
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Start server on specified port and bind on all interfaces
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
