# Manual Unit Testing Framework

A simple, zero-dependency testing framework for the food delivery backend.

## 📁 Structure

```
tests/
├── test-utils.ts       # Testing utilities and assertions
├── run-tests.ts        # Test runner script
├── example.test.ts     # Example test file
└── auth.test.ts        # Authentication tests
```

## 🚀 Running Tests

```bash
# Run all tests
npm test
# or
pnpm test
```

## ✍️ Writing Tests

### Basic Test Structure

```typescript
import { createTestSuite, Assert } from "./test-utils.js";

const suite = createTestSuite("My Feature Tests");

suite.test("should do something", () => {
  const result = 2 + 2;
  Assert.equal(result, 4, "Math should work");
});

suite.run();
```

### With Setup and Teardown

```typescript
suite.beforeAll(async () => {
  // Runs once before all tests
  console.log("Setting up...");
});

suite.afterAll(async () => {
  // Runs once after all tests
  console.log("Cleaning up...");
});

suite.beforeEach(async () => {
  // Runs before each test
});

suite.afterEach(async () => {
  // Runs after each test
});
```

### Async Tests

```typescript
suite.test("async operation", async () => {
  const result = await someAsyncFunction();
  Assert.isDefined(result);
});
```

## 🔍 Available Assertions

### Equality

- `Assert.equal(actual, expected, message?)` - Strict equality (===)
- `Assert.notEqual(actual, expected, message?)` - Strict inequality (!==)
- `Assert.deepEqual(actual, expected, message?)` - Deep object comparison

### Boolean

- `Assert.isTrue(value, message?)`
- `Assert.isFalse(value, message?)`

### Null/Undefined

- `Assert.isNull(value, message?)`
- `Assert.isNotNull(value, message?)`
- `Assert.isDefined(value, message?)`
- `Assert.isUndefined(value, message?)`

### Arrays

- `Assert.includes(array, value, message?)`
- `Assert.notIncludes(array, value, message?)`

### Numbers

- `Assert.greaterThan(actual, expected, message?)`
- `Assert.lessThan(actual, expected, message?)`

### Strings

- `Assert.match(actual, pattern, message?)` - Regex matching

### Errors

- `await Assert.throws(fn, message?)` - Expects function to throw
- `await Assert.doesNotThrow(fn, message?)` - Expects function not to throw

## 📝 Example: Database Test

```typescript
import { createTestSuite, Assert } from "./test-utils.js";
import { db } from "../src/db/index.js";
import * as schema from "../src/db/schema/index.js";

const suite = createTestSuite("User Tests");

let userId: string;

suite.beforeAll(async () => {
  // Setup test data
});

suite.afterAll(async () => {
  // Cleanup
  if (userId) {
    await db.delete(schema.users).where(schema.users.id.equals(userId));
  }
  await db.$client.end();
});

suite.test("create user", async () => {
  const [user] = await db
    .insert(schema.users)
    .values({
      id: "test-123",
      email: "test@example.com",
      password: "hashed",
      name: "Test User",
      phone: "+1234567890",
      role: "customer",
    })
    .returning();

  userId = user.id;
  Assert.equal(user.email, "test@example.com");
});

suite.run();
```

## 🎯 Features

- ✅ No external dependencies
- ✅ TypeScript support
- ✅ Async/await support
- ✅ Setup/teardown hooks
- ✅ Clear error messages
- ✅ Colored console output
- ✅ Exit codes for CI/CD
- ✅ Simple and easy to understand

## 📊 Output

The test runner provides clear, colored output:

```
🧪 Running 3 tests...

✅ should do something
✅ async operation works
❌ this test fails

==================================================

📊 Test Summary:
   Total: 3
   ✅ Passed: 2
   ❌ Failed: 1

❌ Failed Tests:

   this test fails:
   Expected 5 but got 4
```
