const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// ---------------------------------------------------------------
// CORS - restrict to configured frontend origin(s) only
// ---------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------
// Static media serving: /uploads/videos/... and /uploads/thumbnails/...
// ---------------------------------------------------------------
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ---------------------------------------------------------------
// Health check
// ---------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));

// ---------------------------------------------------------------
// API routes
// ---------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
