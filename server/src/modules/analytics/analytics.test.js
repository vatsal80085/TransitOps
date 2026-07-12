const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('../vehicles/vehicle.model');
const Trip = require('../../models/Trip');
const Maintenance = require('../maintenance/maintenance.model');
const FuelLog = require('../fuel/fuel.model');
const Expense = require('../../models/Expense');

let managerCookie;
let analystCookie;
let safetyCookie;
let vehicle;
let trip;

const testManager = {
  name: 'Fleet Manager',
  email: 'manager-anal-test@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

const testAnalyst = {
  name: 'Financial Analyst',
  email: 'analyst-anal-test@transitops.com',
  password: 'Password123!',
  role: 'FINANCIAL_ANALYST',
};

const testSafety = {
  name: 'Safety Officer',
  email: 'safety-anal-test@transitops.com',
  password: 'Password123!',
  role: 'SAFETY_OFFICER',
};

beforeAll(async () => {
  const dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  const cleanURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
  await mongoose.connect(cleanURI);

  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Trip.deleteMany({});
  await Maintenance.deleteMany({});
  await FuelLog.deleteMany({});
  await Expense.deleteMany({});

  await User.create(testManager);
  await User.create(testAnalyst);
  await User.create(testSafety);

  const lm = await request(app).post('/api/v1/auth/login').send({ email: testManager.email, password: testManager.password });
  managerCookie = lm.headers['set-cookie'];

  const la = await request(app).post('/api/v1/auth/login').send({ email: testAnalyst.email, password: testAnalyst.password });
  analystCookie = la.headers['set-cookie'];

  const ls = await request(app).post('/api/v1/auth/login').send({ email: testSafety.email, password: testSafety.password });
  safetyCookie = ls.headers['set-cookie'];

  // Setup seed structures
  vehicle = await Vehicle.create({
    registrationNumber: 'MH-12-AN-0001',
    name: 'Van Analytics',
    model: 'Tata Ace',
    type: 'Van',
    maximumLoadCapacity: 500,
    odometer: 1000,
    acquisitionCost: 10000,
    region: 'North',
    status: 'ON_TRIP',
  });

  // Trip
  trip = await Trip.create({
    source: 'Warehouse A',
    destination: 'Client B',
    vehicle: vehicle._id,
    driver: new mongoose.Types.ObjectId(), // mock driver
    cargo_weight: 400,
    planned_distance: 100,
    actual_distance: 90,
    fuel_consumed: 10,
    status: 'Completed',
  });

  // Maintenance
  await Maintenance.create({
    vehicleId: vehicle._id,
    maintenanceType: 'Engine Service',
    description: 'Oil check',
    startDate: new Date(),
    cost: 500,
    status: 'COMPLETED',
    createdBy: new mongoose.Types.ObjectId(),
  });

  // Fuel Log
  await FuelLog.create({
    vehicleId: vehicle._id,
    liters: 10,
    cost: 40,
    odometer: 1090,
    createdBy: new mongoose.Types.ObjectId(),
  });

  // Expenses: TOLL (counts) and FUEL (should be ignored in op cost calculations)
  await Expense.create({
    vehicleId: vehicle._id,
    type: 'TOLL',
    amount: 15,
    description: 'Highway toll',
    createdBy: new mongoose.Types.ObjectId(),
  });

  await Expense.create({
    vehicleId: vehicle._id,
    type: 'FUEL',
    amount: 60,
    description: 'Double counted fuel charge',
    createdBy: new mongoose.Types.ObjectId(),
  });
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {}
  await mongoose.connection.close();
});

describe('Analytics APIs & RBAC Controls', () => {
  test('FLEET_MANAGER should fetch fleet utilization', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/fleet-utilization')
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.utilizationRate).toBe(100); // 1 vehicle active, 1 ON_TRIP
  });

  test('SAFETY_OFFICER should not fetch fleet-utilization (403)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/fleet-utilization')
      .set('Cookie', safetyCookie);

    expect(res.statusCode).toBe(403);
  });

  test('FLEET_MANAGER should fetch fuel efficiency with correct derived calculation', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/fuel-efficiency?vehicleId=${vehicle._id}`)
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.efficiency).toBe(9); // 90 actual distance / 10 fuel consumed
  });

  test('FLEET_MANAGER should fetch operational costs without fuel/maintenance duplicates', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/operational-cost?vehicleId=${vehicle._id}`)
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.fuelCost).toBe(40);
    expect(res.body.data.maintenanceCost).toBe(500);
    expect(res.body.data.otherCost).toBe(15); // TOLL is included, FUEL is excluded
    expect(res.body.data.totalOperationalCost).toBe(555); // 40 + 500 + 15
  });

  test('FLEET_MANAGER should fetch vehicle ROI successfully', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/vehicle-roi?vehicleId=${vehicle._id}`)
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    // revenue: planned_distance (100) * 2 = 200
    // costs: fuelCost (40) + maintenanceCost (500) = 540
    // acquisitionCost: 10000
    // ROI = (200 - 540) / 10000 = -0.034
    expect(res.body.data.roi).toBeCloseTo(-0.034, 3);
  });
});
