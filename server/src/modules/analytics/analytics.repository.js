const Vehicle = require('../vehicles/vehicle.model');
const Trip = require('../../models/Trip');
const Maintenance = require('../maintenance/maintenance.model');
const FuelLog = require('../fuel/fuel.model');
const Expense = require('../../models/Expense');
const mongoose = require('mongoose');

class AnalyticsRepository {
  async getFleetUtilization() {
    // Computes: (Vehicles ON_TRIP / Active Vehicles) * 100
    // Active vehicles: AVAILABLE, ON_TRIP, IN_SHOP (excludes RETIRED)
    const stats = await Vehicle.aggregate([
      {
        $match: {
          status: { $ne: 'RETIRED' }
        }
      },
      {
        $group: {
          _id: null,
          totalActive: { $sum: 1 },
          onTrip: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ON_TRIP'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalActive: 1,
          onTrip: 1,
          utilizationRate: {
            $cond: [
              { $gt: ['$totalActive', 0] },
              { $multiply: [{ $divide: ['$onTrip', '$totalActive'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    return stats[0] || { totalActive: 0, onTrip: 0, utilizationRate: 0 };
  }

  async getFuelEfficiency(vehicleId = null) {
    // Computes: Distance Travelled / Fuel Consumed
    // Gathers actual_distance and fuel_consumed from Completed trips
    const matchStage = { status: 'Completed' };
    if (vehicleId) {
      matchStage.vehicle = new mongoose.Types.ObjectId(vehicleId);
    }

    const stats = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: vehicleId ? '$vehicle' : null,
          totalDistance: { $sum: '$actual_distance' },
          totalFuel: { $sum: '$fuel_consumed' }
        }
      },
      {
        $project: {
          _id: 0,
          totalDistance: 1,
          totalFuel: 1,
          efficiency: {
            $cond: [
              { $gt: ['$totalFuel', 0] },
              { $divide: ['$totalDistance', '$totalFuel'] },
              0
            ]
          }
        }
      }
    ]);

    return stats[0] || { totalDistance: 0, totalFuel: 0, efficiency: 0 };
  }

  async getOperationalCost(vehicleId = null) {
    // Computes: Fuel Cost + Maintenance Cost + Other non-fuel/non-maintenance Expenses
    const matchFilter = {};
    if (vehicleId) {
      matchFilter.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    }

    const fuelAgg = await FuelLog.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const maintenanceAgg = await Maintenance.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, total: { $sum: '$cost' } } }
    ]);

    const expenseMatch = {
      ...matchFilter,
      type: { $nin: ['FUEL', 'MAINTENANCE'] }
    };
    const expenseAgg = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const fuelCost = fuelAgg[0]?.total || 0;
    const maintenanceCost = maintenanceAgg[0]?.total || 0;
    const otherCost = expenseAgg[0]?.total || 0;

    return {
      fuelCost,
      maintenanceCost,
      otherCost,
      totalOperationalCost: fuelCost + maintenanceCost + otherCost
    };
  }

  async getVehicleROI(vehicleId) {
    // ROI = (Trip Revenue - (Maintenance + Fuel Costs)) / Acquisition Cost
    // We assume Trip Revenue is mock computed or derived from trip weights/distances or simply a flat rate for this platform.
    // In TransitOps, let's treat completed Trip planned_distance * 1.5 as estimated revenue or retrieve trip metrics.
    // Let's aggregate completed Trip planned_distance * 2 as revenue.
    const vId = new mongoose.Types.ObjectId(vehicleId);
    const vehicle = await Vehicle.findById(vId);
    if (!vehicle) {
      return { revenue: 0, costs: 0, acquisitionCost: 0, roi: 0 };
    }

    const trips = await Trip.aggregate([
      { $match: { vehicle: vId, status: 'Completed' } },
      {
        $group: {
          _id: null,
          revenue: { $sum: { $multiply: ['$planned_distance', 2] } }
        }
      }
    ]);

    const opCosts = await this.getOperationalCost(vehicleId);
    const revenue = trips[0]?.revenue || 0;
    const costs = opCosts.fuelCost + opCosts.maintenanceCost;
    const acquisitionCost = vehicle.acquisitionCost || 1;

    const roi = (revenue - costs) / acquisitionCost;

    return {
      revenue,
      costs,
      acquisitionCost,
      roi
    };
  }
}

module.exports = new AnalyticsRepository();
