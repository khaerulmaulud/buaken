import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema/index.js';
import { orderService } from '../src/services/order.service.js';
import { Assert, createTestSuite, Logger } from './test-utils.js';

const suite = createTestSuite('Stock Management Tests');

// Test data
let merchantUserId: string;
let merchantId: string;
let categoryId: string;
let customerUserId: string;
let customerAddressId: string;

// Map of menu item IDs for cleanup
const menuItemIds: string[] = [];
const orderIds: string[] = [];

suite.beforeAll(async () => {
  console.log('  🏗️  Setting up stock management test scenario...');

  // Create Merchant User & Profile
  const hashedPassword = await bcrypt.hash('Merchant123!', 10);
  const [merchantUser] = await db
    .insert(schema.users)
    .values({
      email: `merchant-stock-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Stock Test Merchant',
      phone: '+1234567890',
      role: 'merchant',
    })
    .returning();
  merchantUserId = merchantUser.id;

  const [merchant] = await db
    .insert(schema.merchants)
    .values({
      userId: merchantUserId,
      storeName: 'Stock Test Store',
      description: 'Testing stock management',
      addressLine: '123 Test St',
      phone: '+1234567890',
      city: 'Test City',
      latitude: '0',
      longitude: '0',
      isOpen: true,
      openingTime: '08:00:00',
      closingTime: '22:00:00',
      deliveryFee: '5000',
      minOrder: '10000',
      estimatedDeliveryTime: 30,
    })
    .returning();
  merchantId = merchant.id;

  // Create Category
  const [category] = await db
    .insert(schema.categories)
    .values({
      name: 'Stock Test Category',
      slug: `stock-test-${Date.now()}`,
    })
    .returning();
  categoryId = category.id;

  // Create Customer User & Address
  const [customerUser] = await db
    .insert(schema.users)
    .values({
      email: `customer-stock-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Stock Test Customer',
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
});

suite.afterAll(async () => {
  console.log('  🧹 Cleaning up stock test data...');
  // Cleanup orders first
  for (const id of orderIds) {
    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    await db.delete(schema.orders).where(eq(schema.orders.id, id));
  }

  // Cleanup menu items
  for (const id of menuItemIds) {
    await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  }

  // Cleanup other entities
  if (categoryId)
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, categoryId));
  if (customerAddressId)
    await db
      .delete(schema.userAddresses)
      .where(eq(schema.userAddresses.id, customerAddressId));
  if (merchantId)
    await db
      .delete(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));
  if (merchantUserId)
    await db.delete(schema.users).where(eq(schema.users.id, merchantUserId));
  if (customerUserId)
    await db.delete(schema.users).where(eq(schema.users.id, customerUserId));
});

// Helper to create menu item
async function createMenuItem(name: string, stock: number | null) {
  const [item] = await db
    .insert(schema.menuItems)
    .values({
      merchantId,
      categoryId,
      name,
      description: 'Test Item',
      price: '15000',
      isAvailable: true,
      preparationTime: 10,
      stock: stock,
    })
    .returning();
  menuItemIds.push(item.id);
  return item;
}

// Helper to create order
async function createOrder(menuItemId: string, quantity: number) {
  try {
    const order = await orderService.createOrder(customerUserId, {
      merchantId,
      deliveryAddressId: customerAddressId,
      paymentMethod: 'cash',
      items: [{ menuItemId, quantity }],
    });
    Logger.raw('Order Response', order);
    orderIds.push(order.id);
    return order;
  } catch (error) {
    Logger.raw('Create Order Error', error);
    throw error;
  }
}

suite.test('1. Unlimited Stock (null)', async () => {
  const item = await createMenuItem('Unlimited Item', null);
  Logger.raw('Created Unlimited Item', item);

  // Create order
  const order = await createOrder(item.id, 5);
  Assert.isDefined(order, 'Order should be created');

  // Verify stock remains null
  const [updatedItem] = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.id, item.id));
  Logger.raw('Updated Unlimited Item', updatedItem);
  Assert.isNull(updatedItem.stock, 'Stock should remain null');
});

suite.test('2. Sufficient Stock', async () => {
  const initialStock = 10;
  const quantity = 2;
  const item = await createMenuItem('Sufficient Item', initialStock);
  Logger.raw('Created Sufficient Item', item);

  // Create order
  const order = await createOrder(item.id, quantity);
  Assert.isDefined(order, 'Order should be created');

  // Verify stock decremented
  const [updatedItem] = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.id, item.id));
  Logger.raw('Updated Sufficient Item', updatedItem);
  Assert.equal(
    updatedItem.stock,
    initialStock - quantity,
    `Stock should be ${initialStock - quantity}`,
  );
});

suite.test('3. Insufficient Stock', async () => {
  const initialStock = 2;
  const quantity = 3;
  const item = await createMenuItem('Insufficient Item', initialStock);
  Logger.raw('Created Insufficient Item', item);

  // Try to create order
  try {
    await createOrder(item.id, quantity);
    Assert.fail('Should have thrown error');
  } catch (error: any) {
    Assert.isTrue(
      error.message.includes('Insufficient stock'),
      'Error should be about stock',
    );
  }

  // Verify stock remains unchanged
  const [updatedItem] = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.id, item.id));
  Logger.raw('Updated Insufficient Item', updatedItem);
  Assert.equal(
    updatedItem.stock,
    initialStock,
    'Stock should remain unchanged',
  );
});

suite.test('4. Exact Stock', async () => {
  const initialStock = 5;
  const quantity = 5;
  const item = await createMenuItem('Exact Item', initialStock);
  Logger.raw('Created Exact Item', item);

  // Create order
  const order = await createOrder(item.id, quantity);
  Assert.isDefined(order, 'Order should be created');

  // Verify stock becomes 0
  const [updatedItem] = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.id, item.id));
  Logger.raw('Updated Exact Item', updatedItem);
  Assert.equal(updatedItem.stock, 0, 'Stock should be 0');
});

suite.test('5. Out of Stock', async () => {
  const initialStock = 0;
  const quantity = 1;
  const item = await createMenuItem('Out of Stock Item', initialStock);
  Logger.raw('Created Out of Stock Item', item);

  // Try to create order
  try {
    await createOrder(item.id, quantity);
    Assert.fail('Should have thrown error');
  } catch (error: any) {
    Assert.isTrue(
      error.message.includes('Insufficient stock'),
      'Error should be about stock',
    );
  }
});

suite.run();
