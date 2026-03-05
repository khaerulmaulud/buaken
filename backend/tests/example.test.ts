import { sql } from 'drizzle-orm';
import { db } from '../src/db/index.js';
import { Assert, createTestSuite } from './test-utils.js';

// Example: Testing database connection and basic operations
const suite = createTestSuite('Database Tests');

suite.beforeAll(async () => {
  console.log('  🔧 Setting up database connection...');
});

suite.test('Database connection should work', async () => {
  // Simple query to verify connection using Drizzle's sql template
  const result = await db.execute(sql`SELECT 1 as value`);
  Assert.isDefined(result, 'Query result should be defined');
});

suite.test('Basic assertion examples', () => {
  // Number assertions
  Assert.equal(1 + 1, 2, 'Math should work');
  Assert.notEqual(1, 2, 'Numbers should be different');
  Assert.greaterThan(5, 3, '5 should be greater than 3');
  Assert.lessThan(3, 5, '3 should be less than 5');

  // Boolean assertions
  Assert.isTrue(true, 'Should be true');
  Assert.isFalse(false, 'Should be false');

  // Object assertions
  Assert.deepEqual({ a: 1 }, { a: 1 }, 'Objects should be equal');

  // Array assertions
  Assert.includes([1, 2, 3], 2, 'Array should include 2');
  Assert.notIncludes([1, 2, 3], 4, 'Array should not include 4');

  // String assertions
  Assert.match('hello world', /hello/, 'String should match pattern');
});

suite.test('Async operations should work', async () => {
  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  await wait(100);
  Assert.isTrue(true, 'Async test completed');
});

// Run the tests
suite.run();
