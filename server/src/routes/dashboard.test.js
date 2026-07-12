require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../modules/users/user.model');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Expense = require('../models/Expense');
const FuelLog = require('../modules/fuel/fuel.model');

let managerCookie;

const testManager = {
  name: 'Fleet Manager',
  email: 'manager-dash-test@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

beforeAll(async () => {
  const dbURI = process.env.MONGODB_URI 
  ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
  : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
const cleanURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
await mongoose.connect(cleanURI);

  await User.deleteMany({});
  await User.create(testManager);

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: testManager.email, password: testManager.password });
  managerCookie = loginRes.headers['set-cookie'];
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {}
  await mongoose.connection.close();
});

describe('Dashboard and Expense APIs', () => {
  test('Should list expenses successfully', async () => {
    // Create a vehicle to relate to
    const vehicle = await Vehicle.create({
      registrationNumber: 'MH-12-DB-0001',
      name: 'Test Van',
      model: 'Tata Ace',
      type: 'Van',
      maximumLoadCapacity: 500,
      odometer: 100,
      acquisitionCost: 10000,
      region: 'North',
      status: 'AVAILABLE',
    });

    const expenseRes = await request(app)
      .post('/api/v1/expenses')
      .set('Cookie', managerCookie)
      .send({
        vehicleId: vehicle._id,
        type: 'TOLL',
        amount: 50,
        description: 'Toll fee MH-12',
      });

    expect(expenseRes.statusCode).toBe(201);
    expect(expenseRes.body.success).toBe(true);

    const getRes = await request(app)
      .get('/api/v1/expenses')
      .set('Cookie', managerCookie);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.length).toBe(1);
    expect(getRes.body.data[0].amount).toBe(50);
  });

  test('Should fetch dashboard summary with valid aggregate figures', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalExpenses).toBeGreaterThanOrEqual(50);
    expect(res.body.data.dispatchTrend).toBeDefined();
    expect(res.body.data.vehicleStatusBreakdown).toBeDefined();
    expect(res.body.data.recentActivity).toBeDefined();
  });

  test('Should support query filters on the dashboard summary endpoint', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary?vehicleType=Van&region=North&status=AVAILABLE')
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.activeVehicles).toBe(0);
    expect(res.body.data.summary.availableVehicles).toBeGreaterThanOrEqual(0);
  });
});
