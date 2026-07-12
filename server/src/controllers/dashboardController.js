const Vehicle = require('../modules/vehicles/vehicle.model');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../modules/maintenance/maintenance.model');
const FuelLog = require('../modules/fuel/fuel.model');
const Expense = require('../models/Expense');

const getDashboardSummary = async (req, res, next) => {
  try {
    const { vehicleType, status, region } = req.query;

    const vehicleQuery = {};
    if (vehicleType) vehicleQuery.type = vehicleType;
    if (status) vehicleQuery.status = status;
    if (region) vehicleQuery.region = region;

    const hasFilters = Object.keys(vehicleQuery).length > 0;
    let vehicleIds = [];
    if (hasFilters) {
      const matchingVehicles = await Vehicle.find(vehicleQuery).select('_id');
      vehicleIds = matchingVehicles.map((v) => v._id);
    }

    // 1. Calculate active vehicles, available vehicles, pending dispatches, active trips, drivers on duty
    const activeVehiclesCount = await Vehicle.countDocuments({ ...vehicleQuery, status: 'ON_TRIP' });
    const availableVehiclesCount = await Vehicle.countDocuments({ ...vehicleQuery, status: 'AVAILABLE' });
    const totalVehiclesCount = await Vehicle.countDocuments(vehicleQuery);

    const tripQuery = { status: 'Draft' };
    if (hasFilters) tripQuery.vehicle = { $in: vehicleIds };
    const pendingDispatchesCount = await Trip.countDocuments(tripQuery);

    const activeTripQuery = { status: 'Dispatched' };
    if (hasFilters) activeTripQuery.vehicle = { $in: vehicleIds };
    const activeTripsCount = await Trip.countDocuments(activeTripQuery);

    const maintenanceQuery = { status: 'ACTIVE' };
    if (hasFilters) maintenanceQuery.vehicleId = { $in: vehicleIds };
    const maintenanceDueCount = await Maintenance.countDocuments(maintenanceQuery);

    const driverFilter = { status: { $in: ['Available', 'On Trip'] } };
    if (region) driverFilter.region = region;
    const driversOnDutyCount = await Driver.countDocuments(driverFilter);

    const fleetUtilization = totalVehiclesCount > 0 ? ((activeVehiclesCount / totalVehiclesCount) * 100).toFixed(1) : 0;

    // 2. Calculate total expenses (expenses + maintenance cost + fuel log cost)
    const expenseMatch = hasFilters ? { vehicleId: { $in: vehicleIds } } : {};
    const maintenanceMatch = hasFilters ? { vehicleId: { $in: vehicleIds } } : {};
    const fuelLogMatch = hasFilters ? { vehicleId: { $in: vehicleIds } } : {};

    const expenseAgg = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const maintenanceAgg = await Maintenance.aggregate([
      { $match: maintenanceMatch },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const fuelLogAgg = await FuelLog.aggregate([
      { $match: fuelLogMatch },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);

    const totalExpenseAmount =
      (expenseAgg[0]?.total || 0) +
      (maintenanceAgg[0]?.total || 0) +
      (fuelLogAgg[0]?.total || 0);

    // 3. Dispatch trend (last 7 days counts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendMatch = { createdAt: { $gte: sevenDaysAgo } };
    if (hasFilters) {
      trendMatch.vehicle = { $in: vehicleIds };
    }

    const dispatchTrendAgg = await Trip.aggregate([
      {
        $match: trendMatch,
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      trendMap[dateString] = { day: dayName, dispatches: 0 };
    }

    dispatchTrendAgg.forEach((item) => {
      if (trendMap[item._id]) {
        trendMap[item._id].dispatches = item.count;
      }
    });

    const dispatchTrend = Object.values(trendMap);

    // 4. Vehicle status breakdown
    const vehicleBreakdownAgg = await Vehicle.aggregate([
      {
        $match: vehicleQuery,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdownMap = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
    vehicleBreakdownAgg.forEach((item) => {
      breakdownMap[item._id] = item.count;
    });

    const vehicleStatusBreakdown = [
      { status: 'active', count: breakdownMap.ON_TRIP },
      { status: 'idle', count: breakdownMap.AVAILABLE },
      { status: 'maintenance', count: breakdownMap.IN_SHOP },
    ];

    // 5. Recent activity (fetch latest from trips, maintenance, and expenses, merge and sort)
    const recentTripQuery = hasFilters ? { vehicle: { $in: vehicleIds } } : {};
    const recentMaintenanceQuery = hasFilters ? { vehicleId: { $in: vehicleIds } } : {};
    const recentExpenseQuery = hasFilters ? { vehicleId: { $in: vehicleIds } } : {};

    const recentTrips = await Trip.find(recentTripQuery)
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('vehicle', 'registrationNumber')
      .populate('driver', 'name');

    const recentMaintenance = await Maintenance.find(recentMaintenanceQuery)
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('vehicleId', 'registrationNumber');

    const recentExpenses = await Expense.find(recentExpenseQuery)
      .sort({ date: -1 })
      .limit(3)
      .populate('vehicleId', 'registrationNumber');

    const activities = [];

    recentTrips.forEach((t) => {
      activities.push({
        date: t.createdAt.toISOString().split('T')[0],
        type: 'Dispatch',
        description: `Trip ${t.status} from ${t.source} to ${t.destination} using ${t.vehicle?.registrationNumber || 'N/A'}`,
        status: t.status,
        timestamp: t.createdAt.getTime(),
      });
    });

    recentMaintenance.forEach((m) => {
      activities.push({
        date: m.createdAt.toISOString().split('T')[0],
        type: 'Maintenance',
        description: `${m.maintenanceType} maintenance for ${m.vehicleId?.registrationNumber || 'N/A'} (${m.status})`,
        status: m.status,
        timestamp: m.createdAt.getTime(),
      });
    });

    recentExpenses.forEach((e) => {
      activities.push({
        date: e.date.toISOString().split('T')[0],
        type: 'Expense',
        description: `${e.type} charge logged for ${e.vehicleId?.registrationNumber || 'N/A'}: $${e.amount}`,
        status: 'Logged',
        timestamp: e.date.getTime(),
      });
    });

    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivity = activities.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeVehicles: activeVehiclesCount,
          availableVehicles: availableVehiclesCount,
          pendingDispatches: pendingDispatchesCount,
          activeTrips: activeTripsCount,
          maintenanceDue: maintenanceDueCount,
          totalExpenses: totalExpenseAmount,
          driversOnDuty: driversOnDutyCount,
          fleetUtilization: Number(fleetUtilization),
        },
        dispatchTrend,
        vehicleStatusBreakdown,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
