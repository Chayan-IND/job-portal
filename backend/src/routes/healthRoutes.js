const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    db: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
