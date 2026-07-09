const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRoutes = require('./routes/auth.route');
const patientRoutes = require('./routes/patient.route');
const exerciseRoutes = require('./routes/exercise.route');
const programRoutes = require('./routes/program.route');
const sessionRoutes = require('./routes/session.route');
const dashboardRoutes = require('./routes/dashboard.route');
const adminRoutes = require('./routes/admin.route');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'MotionCare Backend is running' }));

// Root Route
app.get('/', (req, res) => res.send('Welcome to the MotionCare API! Try accessing /api/health'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something broke!' });
});

module.exports = app;