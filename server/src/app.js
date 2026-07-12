const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const fuelRoutes = require('./modules/fuel/fuel.routes');
const expensesRoutes = require('./modules/expenses/expenses.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const { NotFoundError } = require('./shared/errors/customErrors');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to TransitOps API v1',
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/fuel-logs', fuelRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/v1/trips', tripRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Catch-all route for unhandled endpoints
app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
