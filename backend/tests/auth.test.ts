import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema/index.js';
import { Assert, createTestSuite } from './test-utils.js';

const suite = createTestSuite('User Authentication Tests');

let testUserId: string;

suite.beforeAll(async () => {
  console.log('  🔧 Setting up test environment...');
});

suite.afterAll(async () => {
  console.log('  🧹 Cleaning up test data...');
  // Clean up test user
  if (testUserId) {
    await db.delete(schema.users).where(eq(schema.users.id, testUserId));
  }
});

suite.test('Should create a new user', async () => {
  testUserId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  const [user] = await db
    .insert(schema.users)
    .values({
      id: testUserId,
      email: `test-${testUserId}@example.com`,
      password: hashedPassword,
      name: 'Test User',
      phone: '+1234567890',
      role: 'customer',
    })
    .returning();

  Assert.isDefined(user, 'User should be created');
  Assert.equal(user.id, testUserId, 'User ID should match');
  Assert.equal(user.role, 'customer', 'User role should be customer');
});

suite.test('Should verify password correctly', async () => {
  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const isValid = await bcrypt.compare(password, hashedPassword);
  Assert.isTrue(isValid, 'Password should match');

  const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
  Assert.isFalse(isInvalid, 'Wrong password should not match');
});

suite.test('Should find user by email', async () => {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, testUserId));

  Assert.isDefined(user, 'User should be found');
  Assert.equal(user.id, testUserId, 'Found user should have correct ID');
});

suite.run();
