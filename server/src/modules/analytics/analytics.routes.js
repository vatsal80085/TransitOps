const express = require('express');
const {
  getFleetUtilization,
  getFuelEfficiency,
  getOperationalCost,
  getVehicleROI,
} = require('./analytics.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { vehicleIdQuerySchema } = require('./analytics.validation');

const router = express.Router();

router.use(protect);

router.get(
  '/fleet-utilization',
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  getFleetUtilization
);

router.get(
  '/fuel-efficiency',
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'),
  validate(vehicleIdQuerySchema),
  getFuelEfficiency
);

router.get(
  '/operational-cost',
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  validate(vehicleIdQuerySchema),
  getOperationalCost
);

router.get(
  '/vehicle-roi',
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  validate(vehicleIdQuerySchema),
  getVehicleROI
);

module.exports = router;
