const analyticsRepository = require('./analytics.repository');
const Vehicle = require('../vehicles/vehicle.model');
const { NotFoundError } = require('../../shared/errors/customErrors');

const getFleetUtilization = async (req, res, next) => {
  try {
    const data = await analyticsRepository.getFleetUtilization();
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getFuelEfficiency = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const exists = await Vehicle.findById(vehicleId);
      if (!exists) {
        throw new NotFoundError(`Vehicle with ID ${vehicleId} not found`);
      }
    }
    const data = await analyticsRepository.getFuelEfficiency(vehicleId);
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getOperationalCost = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    if (vehicleId) {
      const exists = await Vehicle.findById(vehicleId);
      if (!exists) {
        throw new NotFoundError(`Vehicle with ID ${vehicleId} not found`);
      }
    }
    const data = await analyticsRepository.getOperationalCost(vehicleId);
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleROI = async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    if (!vehicleId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'vehicleId query parameter is required for ROI calculations',
        },
      });
      return;
    }
    const exists = await Vehicle.findById(vehicleId);
    if (!exists) {
      throw new NotFoundError(`Vehicle with ID ${vehicleId} not found`);
    }
    const data = await analyticsRepository.getVehicleROI(vehicleId);
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFleetUtilization,
  getFuelEfficiency,
  getOperationalCost,
  getVehicleROI,
};
