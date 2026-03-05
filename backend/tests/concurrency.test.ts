import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm'; // Added 'and' for conditional updates
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema/index.js';
import { Assert, createTestSuite, Logger } from './test-utils.js';

const suite = createTestSuite('Concurrency Tests - Order Race Conditions');

// Test Data
let merchantUserId: string;
let merchantId: string;
let categoryId: string;
let menuItemId: string;
let customerUserId: string;
let customerAddressId: string;
let orderId: string;

// Couriers
let courierA_UserId: string;
let courierA_ProfileId: string;
let courierB_UserId: string;
let courierB_ProfileId: string;

suite.beforeAll(async () => {
  Logger.section('Setting up Concurrency Test Environment');
});

suite.afterAll(async () => {
  Logger.section('Cleaning up Concurrency Test Data');
  if (orderId) {
    await db.delete(schema.orders).where(eq(schema.orders.id, orderId));
  }
  // Cleanup Couriers
  if (courierA_ProfileId)
    await db
      .delete(schema.courierProfiles)
      .where(eq(schema.courierProfiles.id, courierA_ProfileId));
  if (courierB_ProfileId)
    await db
      .delete(schema.courierProfiles)
      .where(eq(schema.courierProfiles.id, courierB_ProfileId));
  if (courierA_UserId)
    await db.delete(schema.users).where(eq(schema.users.id, courierA_UserId));
  if (courierB_UserId)
    await db.delete(schema.users).where(eq(schema.users.id, courierB_UserId));

  // Cleanup others
  if (menuItemId)
    await db
      .delete(schema.menuItems)
      .where(eq(schema.menuItems.id, menuItemId));
  if (categoryId)
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, categoryId));
  if (customerAddressId)
    await db
      .delete(schema.userAddresses)
      .where(eq(schema.userAddresses.id, customerAddressId));
  if (customerUserId)
    await db.delete(schema.users).where(eq(schema.users.id, customerUserId));
  if (merchantId)
    await db
      .delete(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));
  if (merchantUserId)
    await db.delete(schema.users).where(eq(schema.users.id, merchantUserId));
});

suite.test('Setup: Create Order ready for pickup', async () => {
  // 1. Create Merchant & Menu
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const [merchantUser] = await db
    .insert(schema.users)
    .values({
      email: `merchant-concurrent-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Concurrent Merchant',
      phone: '+1234567890',
      role: 'merchant',
    })
    .returning();
  merchantUserId = merchantUser.id;

  const [merchant] = await db
    .insert(schema.merchants)
    .values({
      userId: merchantUserId,
      storeName: 'Concurrent Eats',
      description: 'Fast food',
      addressLine: '123 Speed St',
      phone: '+1234567890',
      city: 'Test City',
      latitude: '0',
      longitude: '0',
      isOpen: true,
      openingTime: '00:00:00',
      closingTime: '23:59:59',
      deliveryFee: '1000',
      minOrder: '1000',
      estimatedDeliveryTime: 15,
    })
    .returning();
  merchantId = merchant.id;

  const [category] = await db
    .insert(schema.categories)
    .values({
      name: 'Fast Food',
      slug: `fast-food-${Date.now()}`,
    })
    .returning();
  categoryId = category.id;

  const [menuItem] = await db
    .insert(schema.menuItems)
    .values({
      merchantId: merchantId,
      categoryId: categoryId,
      name: 'Speedy Burger',
      description: 'Very fast burger',
      price: '50000',
      preparationTime: 5,
    })
    .returning();
  menuItemId = menuItem.id;

  // 2. Create Customer
  const [customerUser] = await db
    .insert(schema.users)
    .values({
      email: `customer-concurrent-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Concurrent Customer',
      phone: '+0987654321',
      role: 'customer',
    })
    .returning();
  customerUserId = customerUser.id;

  const [address] = await db
    .insert(schema.userAddresses)
    .values({
      userId: customerUserId,
      label: 'Home',
      addressLine: '456 Test Ave',
      city: 'Test City',
      postalCode: '12345',
      latitude: '0',
      longitude: '0',
      isDefault: true,
    })
    .returning();
  customerAddressId = address.id;

  // 3. Create Order
  const [order] = await db
    .insert(schema.orders)
    .values({
      orderNumber: `ORD-CON-${Date.now()}`,
      customerId: customerUserId,
      merchantId: merchantId,
      deliveryAddressId: customerAddressId,
      status: 'ready_for_pickup', // Directly set to ready state for this test
      subtotal: '50000',
      totalAmount: '51000',
      deliveryFee: '1000',
      paymentMethod: 'cash',
    })
    .returning();
  orderId = order.id;

  Logger.success('Order Setup Complete', { orderId, status: order.status });
});

suite.test('Setup: Create Two Couriers', async () => {
  const hashedPassword = await bcrypt.hash('Courier123!', 10);

  // Courier A
  const [courierA] = await db
    .insert(schema.users)
    .values({
      email: `courier-a-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Courier A (Fast)',
      phone: '+111111111',
      role: 'courier',
    })
    .returning();
  courierA_UserId = courierA.id;

  const [profileA] = await db
    .insert(schema.courierProfiles)
    .values({
      userId: courierA_UserId,
      vehicleType: 'motorcycle',
      vehicleNumber: 'A 1111 AA',
      isOnline: true,
    })
    .returning();
  courierA_ProfileId = profileA.id;

  // Courier B
  const [courierB] = await db
    .insert(schema.users)
    .values({
      email: `courier-b-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Courier B (Furious)',
      phone: '+222222222',
      role: 'courier',
    })
    .returning();
  courierB_UserId = courierB.id;

  const [profileB] = await db
    .insert(schema.courierProfiles)
    .values({
      userId: courierB_UserId,
      vehicleType: 'motorcycle',
      vehicleNumber: 'B 2222 BB',
      isOnline: true,
    })
    .returning();
  courierB_ProfileId = profileB.id;

  Logger.success('Couriers Created', {
    courierA: courierA_UserId,
    courierB: courierB_UserId,
  });
});

suite.test('Race Condition: Two Couriers Accept Same Order', async () => {
  Logger.section('Starting Race Condition Test');

  // Function to attempt pickup
  const attemptPickup = async (courierId: string, courierName: string) => {
    Logger.step(`${courierName} attempting pickup...`);
    // IMPORTANT: Check condition 'status = ready_for_pickup' to prevent overwrite
    const [updatedOrder] = await db
      .update(schema.orders)
      .set({
        courierId: courierId,
        status: 'picked_up',
        pickedUpAt: new Date(),
      })
      .where(
        and(
          eq(schema.orders.id, orderId),
          eq(schema.orders.status, 'ready_for_pickup'), // Optimistic locking condition
        ),
      )
      .returning();

    return updatedOrder; // Will be undefined if update criteria not met
  };

  // Execute simultaneously
  Logger.info('Firing requests simultaneously...');
  const [resultA, resultB] = await Promise.all([
    attemptPickup(courierA_UserId, 'Courier A'),
    attemptPickup(courierB_UserId, 'Courier B'),
  ]);

  Logger.raw('Result A', resultA);
  Logger.raw('Result B', resultB);

  // Assertions
  const successCount = [resultA, resultB].filter(Boolean).length;
  Logger.info(`Successful pickups: ${successCount}`);

  Assert.equal(successCount, 1, 'Only exactly ONE courier should succeed');

  // Check final state
  const [finalOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId));
  Logger.success('Final Order State', {
    id: finalOrder.id,
    status: finalOrder.status,
    courierId: finalOrder.courierId,
    winner:
      finalOrder.courierId === courierA_UserId ? 'Courier A' : 'Courier B',
  });

  Assert.equal(finalOrder.status, 'picked_up');
  Assert.isNotNull(finalOrder.courierId);
});

suite.run();
