require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Driver = require('../models/Driver');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Trip = require('../models/Trip');

beforeAll(async () => {
  let dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test';

  dbURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
  await mongoose.connect(dbURI);
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {
    // DB might not be initialized
  }
  await mongoose.connection.close();
});

let testVehicle;
let testDriver;
let testDriverSuspended;
let testDriverExpired;
let testVehicleInShop;
let testVehicleRetired;

beforeEach(async () => {
  await Driver.deleteMany({});
  await Vehicle.deleteMany({});
  await Trip.deleteMany({});

  // 1. Create standard available vehicle
  testVehicle = await Vehicle.create({
    registrationNumber: 'MH-12-AB-1111',
    name: 'Van 1',
    model: 'Ford Transit',
    type: 'Van',
    maximumLoadCapacity: 500, // 500 kg
    odometer: 1000,
    acquisitionCost: 20000,
    region: 'North',
    status: 'AVAILABLE',
  });

  // 2. Create in-shop vehicle
  testVehicleInShop = await Vehicle.create({
    registrationNumber: 'MH-12-AB-2222',
    name: 'Van 2',
    model: 'Ford Transit',
    type: 'Van',
    maximumLoadCapacity: 500,
    odometer: 1000,
    acquisitionCost: 20000,
    region: 'North',
    status: 'IN_SHOP',
  });

  // 3. Create retired vehicle
  testVehicleRetired = await Vehicle.create({
    registrationNumber: 'MH-12-AB-3333',
    name: 'Van 3',
    model: 'Ford Transit',
    type: 'Van',
    maximumLoadCapacity: 500,
    odometer: 1000,
    acquisitionCost: 20000,
    region: 'North',
    status: 'RETIRED',
  });

  // 4. Create standard eligible driver
  testDriver = await Driver.create({
    name: 'Alex Driver',
    license_number: 'DL-VALID001',
    license_category: 'Class A',
    license_expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year in future
    contact_number: '+15550101',
    safety_score: 90,
    status: 'Available',
    region: 'North',
  });

  // 5. Create suspended driver
  testDriverSuspended = await Driver.create({
    name: 'Bob Suspended',
    license_number: 'DL-SUS002',
    license_category: 'Class B',
    license_expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    contact_number: '+15550102',
    safety_score: 80,
    status: 'Suspended',
    region: 'North',
  });

  // 6. Create expired license driver
  testDriverExpired = await Driver.create({
    name: 'Charlie Expired',
    license_number: 'DL-EXP003',
    license_category: 'Class A',
    license_expiry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days in past
    contact_number: '+15550103',
    safety_score: 85,
    status: 'Available',
    region: 'North',
  });
});

describe('Trip Management and Business Rules', () => {
  const getValidTripPayload = () => ({
    source: 'Warehouse A',
    destination: 'Client B',
    vehicle: testVehicle._id.toString(),
    driver: testDriver._id.toString(),
    cargo_weight: 450, // 450 kg <= 500 kg
    planned_distance: 120,
  });

  // Rule 1: Cannot create trip with cargo weight exceeding vehicle capacity
  test('1. Cannot create a trip where cargo_weight exceeds the vehicle max load capacity', async () => {
    const payload = getValidTripPayload();
    payload.cargo_weight = 550; // exceeds 500

    const res = await request(app)
      .post('/api/trips')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('exceeds vehicle maximum load capacity');
  });

  // Rule 2: Cannot create trip with suspended driver
  test('2. Cannot create a trip with a Suspended driver', async () => {
    const payload = getValidTripPayload();
    payload.driver = testDriverSuspended._id.toString();

    const res = await request(app)
      .post('/api/trips')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Driver is not eligible');
  });

  // Rule 3: Cannot create trip with expired driver license
  test('3. Cannot create a trip with a driver whose license_expiry_date is in the past', async () => {
    const payload = getValidTripPayload();
    payload.driver = testDriverExpired._id.toString();

    const res = await request(app)
      .post('/api/trips')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Driver is not eligible');
  });

  // Rule 4: Cannot create trip with vehicle in shop or retired
  test('4. Cannot create a trip with a vehicle that is In Shop or Retired', async () => {
    const payloadInShop = getValidTripPayload();
    payloadInShop.vehicle = testVehicleInShop._id.toString();

    let res = await request(app)
      .post('/api/trips')
      .send(payloadInShop);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Vehicle is not available');

    const payloadRetired = getValidTripPayload();
    payloadRetired.vehicle = testVehicleRetired._id.toString();

    res = await request(app)
      .post('/api/trips')
      .send(payloadRetired);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Vehicle is not available');
  });

  // Rule 5: Dispatching sets statuses to ON_TRIP / On Trip
  test('5. Dispatching a Draft trip sets both vehicle and driver status to On Trip', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Draft',
    });

    const res = await request(app)
      .patch(`/api/trips/${trip._id}/dispatch`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Dispatched');

    // Verify Vehicle status is ON_TRIP
    const updatedVehicle = await Vehicle.findById(testVehicle._id);
    expect(updatedVehicle.status).toBe('ON_TRIP');

    // Verify Driver status is On Trip
    const updatedDriver = await Driver.findById(testDriver._id);
    expect(updatedDriver.status).toBe('On Trip');
  });

  // Rule 6: Double dispatch fails with 409
  test('6. Attempting to dispatch the same vehicle twice — the second must fail with 409', async () => {
    const trip1 = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Draft',
    });

    // Create another driver so we can attempt a second trip with same vehicle
    const testDriver2 = await Driver.create({
      name: 'Second Driver',
      license_number: 'DL-VALID002',
      license_category: 'Class A',
      license_expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      contact_number: '+15550109',
      safety_score: 95,
      status: 'Available',
      region: 'North',
    });

    const trip2 = await Trip.create({
      source: 'A',
      destination: 'C',
      vehicle: testVehicle._id,
      driver: testDriver2._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Draft',
    });

    // First dispatch succeeds
    let res = await request(app).patch(`/api/trips/${trip1._id}/dispatch`);
    expect(res.statusCode).toBe(200);

    // Second dispatch fails with 409 because vehicle is now ON_TRIP
    res = await request(app).patch(`/api/trips/${trip2._id}/dispatch`);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Rule 7: Completing trip restores statuses and updates odometer
  test('7. Completing a Dispatched trip restores both vehicle and driver to Available', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Dispatched',
    });

    testVehicle.status = 'ON_TRIP';
    await testVehicle.save();
    testDriver.status = 'On Trip';
    await testDriver.save();

    const res = await request(app)
      .patch(`/api/trips/${trip._id}/complete`)
      .send({
        actual_distance: 60,
        fuel_consumed: 15,
        final_odometer: 1060, // current is 1000
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Completed');

    // Verify Vehicle status and odometer
    const updatedVehicle = await Vehicle.findById(testVehicle._id);
    expect(updatedVehicle.status).toBe('AVAILABLE');
    expect(updatedVehicle.odometer).toBe(1060);

    // Verify Driver status
    const updatedDriver = await Driver.findById(testDriver._id);
    expect(updatedDriver.status).toBe('Available');
  });

  // Rule 8: Cancelling dispatched trip restores vehicle/driver
  test('8. Cancelling a Dispatched trip restores both vehicle and driver to Available', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Dispatched',
    });

    testVehicle.status = 'ON_TRIP';
    await testVehicle.save();
    testDriver.status = 'On Trip';
    await testDriver.save();

    const res = await request(app).patch(`/api/trips/${trip._id}/cancel`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Cancelled');

    const updatedVehicle = await Vehicle.findById(testVehicle._id);
    expect(updatedVehicle.status).toBe('AVAILABLE');

    const updatedDriver = await Driver.findById(testDriver._id);
    expect(updatedDriver.status).toBe('Available');
  });

  // Rule 9: Cancelling draft trip does not touch vehicle/driver
  test('9. Cancelling a Draft trip does not touch vehicle/driver status at all', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Draft',
    });

    const res = await request(app).patch(`/api/trips/${trip._id}/cancel`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedVehicle = await Vehicle.findById(testVehicle._id);
    expect(updatedVehicle.status).toBe('AVAILABLE'); // unchanged

    const updatedDriver = await Driver.findById(testDriver._id);
    expect(updatedDriver.status).toBe('Available'); // unchanged
  });

  // Rule 10: Cannot dispatch a non-draft trip
  test('10. Cannot dispatch a trip that is already Dispatched/Completed/Cancelled', async () => {
    const tripDispatched = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Dispatched',
    });

    const res = await request(app).patch(`/api/trips/${tripDispatched._id}/dispatch`);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Concurrency & state checks
  test('11. Cannot create a trip if vehicle is already ON_TRIP', async () => {
    testVehicle.status = 'ON_TRIP';
    await testVehicle.save();

    const payload = getValidTripPayload();
    const res = await request(app).post('/api/trips').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('12. Cannot create a trip if driver is already On Trip', async () => {
    testDriver.status = 'On Trip';
    await testDriver.save();

    const payload = getValidTripPayload();
    const res = await request(app).post('/api/trips').send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('13. Cannot dispatch a trip if driver is already On Trip', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Draft',
    });

    testDriver.status = 'On Trip';
    await testDriver.save();

    const res = await request(app).patch(`/api/trips/${trip._id}/dispatch`);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('14. Cannot complete a trip with negative actual_distance, fuel_consumed, or final_odometer', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Dispatched',
    });

    // negative distance
    let res = await request(app)
      .patch(`/api/trips/${trip._id}/complete`)
      .send({ actual_distance: -10, fuel_consumed: 10, final_odometer: 1050 });
    expect(res.statusCode).toBe(400);

    // negative fuel
    res = await request(app)
      .patch(`/api/trips/${trip._id}/complete`)
      .send({ actual_distance: 50, fuel_consumed: -5, final_odometer: 1050 });
    expect(res.statusCode).toBe(400);

    // negative odometer
    res = await request(app)
      .patch(`/api/trips/${trip._id}/complete`)
      .send({ actual_distance: 50, fuel_consumed: 10, final_odometer: -10 });
    expect(res.statusCode).toBe(400);
  });

  test('15. Cannot cancel a completed trip', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Completed',
    });

    const res = await request(app).patch(`/api/trips/${trip._id}/cancel`);
    expect(res.statusCode).toBe(409);
  });

  test('16. Cannot cancel an already cancelled trip', async () => {
    const trip = await Trip.create({
      source: 'A',
      destination: 'B',
      vehicle: testVehicle._id,
      driver: testDriver._id,
      cargo_weight: 100,
      planned_distance: 50,
      status: 'Cancelled',
    });

    const res = await request(app).patch(`/api/trips/${trip._id}/cancel`);
    expect(res.statusCode).toBe(409);
  });
});
