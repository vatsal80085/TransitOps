const Vehicle = require('./vehicle.model');
const FuelLog = require('../fuel/fuel.model');
const Maintenance = require('../maintenance/maintenance.model');

class VehicleRepository {
  async create(vehicleData) {
    return await Vehicle.create(vehicleData);
  }

  async findById(id) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return null;

    const vehicleObj = vehicle.toObject();

    const fuelCostAgg = await FuelLog.aggregate([
      { $match: { vehicleId: vehicle._id } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    vehicleObj.totalFuelCost = fuelCostAgg[0]?.total || 0;

    const maintCostAgg = await Maintenance.aggregate([
      { $match: { vehicleId: vehicle._id } },
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    vehicleObj.totalMaintenanceCost = maintCostAgg[0]?.total || 0;
    vehicleObj.totalOperationalCost = vehicleObj.totalFuelCost + vehicleObj.totalMaintenanceCost;

    return vehicleObj;
  }

  async findByRegistrationNumber(registrationNumber) {
    return await Vehicle.findOne({ registrationNumber });
  }

  async update(id, updateData) {
    return await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async findAndPaginate(queryParams) {
    const { status, type, region, search, sortBy, sortOrder, page, limit } = queryParams;

    const query = {};

    // Filters
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }
    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }

    // Search query matching multiple fields
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination calculations
    const skip = (page - 1) * limit;

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const vehiclesWithCosts = [];
    for (const vehicle of vehicles) {
      const vehicleObj = vehicle.toObject();

      // Aggregate fuel logs
      const fuelCostAgg = await FuelLog.aggregate([
        { $match: { vehicleId: vehicle._id } },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]);
      const totalFuelCost = fuelCostAgg[0]?.total || 0;

      // Aggregate maintenance costs
      const maintCostAgg = await Maintenance.aggregate([
        { $match: { vehicleId: vehicle._id } },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]);
      const totalMaintenanceCost = maintCostAgg[0]?.total || 0;

      vehicleObj.totalFuelCost = totalFuelCost;
      vehicleObj.totalMaintenanceCost = totalMaintenanceCost;
      vehicleObj.totalOperationalCost = totalFuelCost + totalMaintenanceCost;

      vehiclesWithCosts.push(vehicleObj);
    }

    return {
      vehicles: vehiclesWithCosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new VehicleRepository();
