import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema/index.js';
import { Assert, createTestSuite, Logger } from './test-utils.js';

const suite = createTestSuite('Complete Order Workflow - End to End');

// Test data IDs
let merchantUserId: string;
let merchantId: string;
let categoryId: string;
let menuItemId: string;
let customerUserId: string;
let customerAddressId: string;
let courierUserId: string;
let courierProfileId: string;
let reviewId: string;
let orderId: string;

suite.beforeAll(async () => {
  console.log('  🏗️  Setting up complete test scenario...');
});

suite.afterAll(async () => {
  console.log('  🧹 Cleaning up all test data...');

  // Clean up in reverse order of dependencies
  if (orderId) {
    if (reviewId) {
      await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));
    }
    await db
      .delete(schema.orderItems)
      .where(eq(schema.orderItems.orderId, orderId));
    await db.delete(schema.orders).where(eq(schema.orders.id, orderId));
  }
  if (menuItemId) {
    await db
      .delete(schema.menuItems)
      .where(eq(schema.menuItems.id, menuItemId));
  }
  if (categoryId) {
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, categoryId));
  }
  if (customerAddressId) {
    await db
      .delete(schema.userAddresses)
      .where(eq(schema.userAddresses.id, customerAddressId));
  }
  if (courierProfileId) {
    await db
      .delete(schema.courierProfiles)
      .where(eq(schema.courierProfiles.id, courierProfileId));
  }
  if (merchantId) {
    await db
      .delete(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));
  }
  if (merchantUserId) {
    await db.delete(schema.users).where(eq(schema.users.id, merchantUserId));
  }
  if (customerUserId) {
    await db.delete(schema.users).where(eq(schema.users.id, customerUserId));
  }
  if (courierUserId) {
    await db.delete(schema.users).where(eq(schema.users.id, courierUserId));
  }
});

// Step 1: Create Merchant and Menu Items
suite.test('Step 1: Merchant creates account and menu items', async () => {
  // Create merchant user
  const hashedPassword = await bcrypt.hash('Merchant123!', 10);

  const [merchantUser] = await db
    .insert(schema.users)
    .values({
      email: `merchant-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Test Restaurant Owner',
      phone: '+1234567890',
      role: 'merchant',
    })
    .returning();

  merchantUserId = merchantUser.id;
  Logger.raw('Merchant User Response', merchantUser);
  Logger.success('Merchant User Created', {
    id: merchantUser.id,
    email: merchantUser.email,
    name: merchantUser.name,
    role: merchantUser.role,
  });

  Assert.isDefined(merchantUser, 'Merchant user should be created');
  Assert.equal(merchantUser.role, 'merchant', 'User should have merchant role');

  // Create merchant profile
  const [merchant] = await db
    .insert(schema.merchants)
    .values({
      userId: merchantUserId,
      storeName: 'Delicious Food Restaurant',
      description: 'Best food in town',
      addressLine: '123 Restaurant Street',
      phone: '+1234567890',
      city: 'Jakarta',
      latitude: '-6.2088',
      longitude: '106.8456',
      isOpen: true,
      openingTime: '09:00:00',
      closingTime: '22:00:00',
      deliveryFee: '5000',
      minOrder: '15000',
      estimatedDeliveryTime: 30,
    })
    .returning();

  merchantId = merchant.id;
  Logger.raw('Merchant Profile Response', merchant);
  Logger.data('Merchant Profile Created', {
    id: merchant.id,
    storeName: merchant.storeName,
    city: merchant.city,
    isOpen: merchant.isOpen,
    deliveryFee: merchant.deliveryFee,
  });

  Assert.isDefined(merchant, 'Merchant profile should be created');
  Assert.equal(merchant.storeName, 'Delicious Food Restaurant');
  Assert.isTrue(merchant.isOpen, 'Restaurant should be open');

  // Create a category first for the menu item
  const categorySlug = `main-dishes-${Date.now()}`;
  const [category] = await db
    .insert(schema.categories)
    .values({
      name: 'Main Dishes',
      slug: categorySlug,
    })
    .returning();

  categoryId = category.id;
  Logger.raw('Category Response', category);
  Logger.info('Category Created', {
    id: category.id,
    name: category.name,
    slug: category.slug,
  });

  // Create menu item
  const [menuItem] = await db
    .insert(schema.menuItems)
    .values({
      merchantId: merchantId,
      categoryId: category.id,
      name: 'Nasi Goreng Special',
      description: 'Delicious fried rice with egg and chicken',
      price: '25000',
      isAvailable: true,
      preparationTime: 15,
      imageUrl: null,
    })
    .returning();

  menuItemId = menuItem.id;
  Logger.raw('Menu Item Response', menuItem);
  Logger.data('Menu Item Created', {
    id: menuItem.id,
    name: menuItem.name,
    price: menuItem.price,
    category: category.name,
    preparationTime: menuItem.preparationTime,
  });

  Assert.isDefined(menuItem, 'Menu item should be created');
  Assert.equal(menuItem.name, 'Nasi Goreng Special');
  Assert.isTrue(menuItem.isAvailable, 'Menu item should be available');
});

// Step 2: Create Customer and Place Order
suite.test('Step 2: Customer creates account and places order', async () => {
  // Create customer user
  const hashedPassword = await bcrypt.hash('Customer123!', 10);

  const [customerUser] = await db
    .insert(schema.users)
    .values({
      email: `customer-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Test Customer',
      phone: '+0987654321',
      role: 'customer',
    })
    .returning();

  customerUserId = customerUser.id;
  Logger.raw('Customer User Response', customerUser);
  Logger.success('Customer User Created', {
    id: customerUser.id,
    email: customerUser.email,
    name: customerUser.name,
    role: customerUser.role,
  });

  Assert.isDefined(customerUser, 'Customer user should be created');
  Assert.equal(customerUser.role, 'customer');

  // Create customer address
  const [address] = await db
    .insert(schema.userAddresses)
    .values({
      userId: customerUserId,
      label: 'Home',
      addressLine: '456 Customer Avenue',
      city: 'Jakarta',
      postalCode: '12345',
      latitude: '-6.2146',
      longitude: '106.8451',
      notes: 'Ring the doorbell',
      isDefault: true,
    })
    .returning();

  customerAddressId = address.id;
  Logger.raw('Customer Address Response', address);
  Logger.data('Customer Address Created', {
    id: address.id,
    label: address.label,
    city: address.city,
    isDefault: address.isDefault,
  });

  Assert.isDefined(address, 'Customer address should be created');

  // Create order
  const orderNumber = `ORD-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
  const [order] = await db
    .insert(schema.orders)
    .values({
      orderNumber: orderNumber,
      customerId: customerUserId,
      merchantId: merchantId,
      deliveryAddressId: customerAddressId,
      deliveryNotes: 'Extra spicy please',
      status: 'pending',
      subtotal: '25000',
      totalAmount: '30000', // 25000 + 5000 delivery fee
      deliveryFee: '5000',
      courierId: null,
      paymentMethod: 'cash',
    })
    .returning();

  orderId = order.id;
  Logger.raw('Order Response', order);
  Logger.success('Order Created', {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: order.totalAmount,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
  });

  Assert.isDefined(order, 'Order should be created');
  Assert.equal(order.status, 'pending');
  Assert.equal(order.customerId, customerUserId);
  Assert.equal(order.merchantId, merchantId);

  // Create order item
  const [orderItem] = await db
    .insert(schema.orderItems)
    .values({
      orderId: orderId,
      menuItemId: menuItemId,
      quantity: 1,
      price: '25000',
      notes: null,
    })
    .returning();

  Logger.raw('Order Item Response', orderItem);
  Logger.data('Order Item Created', {
    id: orderItem.id,
    quantity: orderItem.quantity,
    price: orderItem.price,
  });

  Assert.isDefined(orderItem, 'Order item should be created');
  Assert.equal(orderItem.quantity, 1);
});

// Step 3: Merchant Accepts and Prepares Order
suite.test('Step 3: Merchant accepts and prepares the order', async () => {
  // Update order status to confirmed
  const [confirmedOrder] = await db
    .update(schema.orders)
    .set({ status: 'confirmed' })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.step(`Order status updated: ${confirmedOrder.status}`);
  Assert.equal(confirmedOrder.status, 'confirmed', 'Order should be confirmed');

  // Update to preparing
  const [preparingOrder] = await db
    .update(schema.orders)
    .set({ status: 'preparing' })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.step(`Order status updated: ${preparingOrder.status}`);
  Assert.equal(preparingOrder.status, 'preparing', 'Order should be preparing');

  // Mark as ready for pickup
  const [readyOrder] = await db
    .update(schema.orders)
    .set({ status: 'ready_for_pickup' })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.step(`Order status updated: ${readyOrder.status}`);
  Assert.equal(
    readyOrder.status,
    'ready_for_pickup',
    'Order should be ready for pickup',
  );
});

// Step 4: Create Courier and Accept Order
suite.test('Step 4: Courier accepts the order for delivery', async () => {
  // Create courier user
  const hashedPassword = await bcrypt.hash('Courier123!', 10);

  const [courierUser] = await db
    .insert(schema.users)
    .values({
      email: `courier-${crypto.randomUUID()}@test.com`,
      password: hashedPassword,
      name: 'Test Courier',
      phone: '+1122334455',
      role: 'courier',
    })
    .returning();

  courierUserId = courierUser.id;

  Logger.raw('Courier User Response', courierUser);
  Logger.success('Courier User Created', {
    id: courierUser.id,
    email: courierUser.email,
    name: courierUser.name,
    role: courierUser.role,
  });

  Assert.isDefined(courierUser, 'Courier user should be created');
  Assert.equal(courierUser.role, 'courier');

  // Create courier profile
  const [courierProfile] = await db
    .insert(schema.courierProfiles)
    .values({
      userId: courierUserId,
      vehicleType: 'motorcycle',
      vehicleNumber: 'B 1234 XYZ',
      isOnline: true,
      currentLatitude: '-6.2088',
      currentLongitude: '106.8456',
    })
    .returning();

  courierProfileId = courierProfile.id;
  Logger.raw('Courier Profile Response', courierProfile);
  Logger.info('Courier Profile Created', {
    id: courierProfile.id,
    vehicleType: courierProfile.vehicleType,
    vehicleNumber: courierProfile.vehicleNumber,
    isOnline: courierProfile.isOnline,
  });

  Assert.isDefined(courierProfile, 'Courier profile should be created');
  Assert.isTrue(courierProfile.isOnline, 'Courier should be online');

  // Assign courier to order
  const [assignedOrder] = await db
    .update(schema.orders)
    .set({
      courierId: courierUserId,
      status: 'picked_up',
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.step(
    `Order assigned to courier and status updated: ${assignedOrder.status}`,
  );
  Assert.equal(
    assignedOrder.courierId,
    courierUserId,
    'Courier should be assigned',
  );
  Assert.equal(assignedOrder.status, 'picked_up', 'Order should be picked up');
});

// Step 5: Courier Delivers Order
suite.test('Step 5: Courier delivers order to customer', async () => {
  // Update to on_delivery
  const [deliveringOrder] = await db
    .update(schema.orders)
    .set({ status: 'on_delivery' })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.step(`Order status updated: ${deliveringOrder.status}`);
  Assert.equal(
    deliveringOrder.status,
    'on_delivery',
    'Order should be on delivery',
  );

  // Complete delivery
  const [deliveredOrder] = await db
    .update(schema.orders)
    .set({
      status: 'delivered',
      deliveredAt: new Date(),
    })
    .where(eq(schema.orders.id, orderId))
    .returning();

  Logger.success('Order Delivered', {
    id: deliveredOrder.id,
    status: deliveredOrder.status,
    deliveredAt: deliveredOrder.deliveredAt,
  });
  Assert.equal(deliveredOrder.status, 'delivered', 'Order should be delivered');
  Assert.isDefined(
    deliveredOrder.deliveredAt,
    'Delivery time should be recorded',
  );
});

// Step 6: Customer Reviews Order
suite.test('Step 6: Customer reviews the order', async () => {
  const [review] = await db
    .insert(schema.reviews)
    .values({
      orderId: orderId,
      customerId: customerUserId,
      merchantId: merchantId,
      rating: 5,
      comment: 'Delicious food and fast delivery!',
    })
    .returning();

  reviewId = review.id;
  Logger.success('Review Created', {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
  });

  Assert.isDefined(review, 'Review should be created');
  Assert.equal(review.rating, 5, 'Rating should be 5');
});

// Step 7: Verify Complete Workflow
suite.test('Step 7: Verify complete order workflow', async () => {
  // Fetch final order state
  const [finalOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId));

  Assert.isDefined(finalOrder, 'Order should exist');
  Assert.equal(
    finalOrder.status,
    'delivered',
    'Final status should be delivered',
  );
  Assert.equal(finalOrder.customerId, customerUserId, 'Customer should match');
  Assert.equal(finalOrder.merchantId, merchantId, 'Merchant should match');
  Assert.equal(finalOrder.courierId, courierUserId, 'Courier should match');
  Assert.isDefined(finalOrder.deliveredAt, 'Delivery timestamp should exist');

  // Verify review exists
  const [finalReview] = await db
    .select()
    .from(schema.reviews)
    .where(eq(schema.reviews.id, reviewId));

  Assert.isDefined(finalReview, 'Review should exist');
  Assert.equal(finalReview.rating, 5, 'Rating should match');

  console.log('\n  ✅ Complete workflow verified:');
  console.log(`     • Merchant: ${merchantUserId}`);
  console.log(`     • Menu Item: ${menuItemId}`);
  console.log(`     • Customer: ${customerUserId}`);
  console.log(`     • Courier: ${courierUserId}`);
  console.log(`     • Order: ${orderId}`);
  console.log(`     • Review: ${reviewId}`);
  console.log(`     • Status: ${finalOrder.status}`);
});

suite.run();
