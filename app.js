const express = require("express");
const cors = require("cors");
const path = require('path');

// ✅ Initialize Express app first
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database instance
const sequelize = require("./config/database");

// ✅ Sync all Sequelize models
sequelize.sync({ alter: true }) 
  .then(() => {
    console.log("✅ All models synced to the database");
  })
  .catch((err) => {
    console.error("❌ Error syncing models:", err);
  });

// ✅ Import Routes
const onboardingRoutes = require("./routes/onboardingRoutes");
const demographicsRoutes = require("./routes/demographicsRoutes"); 
const confounderRoutes = require("./routes/confounderRoutes");
const oralCancerRoutes = require("./routes/oralCancerRoutes");
const larynxRoutes = require('./routes/larynxRoutes'); 
const pharynxRoutes = require("./routes/pharynxRoutes");
const voiceRecordingRoutes = require("./routes/voiceRecordingRoutes");
const grbasRoutes = require("./routes/grbasRoutes");
const sessionProgressRoutes = require('./routes/sessionProgressRoutes');
const vhiRoutes = require('./routes/vhiroutes');


// ✅ Register API Routes
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/demographics", demographicsRoutes);
app.use("/api/oral-cancer", oralCancerRoutes);
app.use('/api/larynx', larynxRoutes);
app.use("/api/confounder", confounderRoutes);
app.use("/api/pharynx", pharynxRoutes);
app.use("/api/voice-recordings", voiceRecordingRoutes);
app.use("/api/grbas", grbasRoutes);
app.use('/api/session-progress', sessionProgressRoutes);
app.use('/api/vhi', vhiRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
