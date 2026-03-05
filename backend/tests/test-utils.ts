// Simple manual testing utilities without external dependencies

export class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private beforeEachHooks: Array<() => Promise<void> | void> = [];
  private afterEachHooks: Array<() => Promise<void> | void> = [];
  private beforeAllHooks: Array<() => Promise<void> | void> = [];
  private afterAllHooks: Array<() => Promise<void> | void> = [];

  private passedTests = 0;
  private failedTests = 0;
  private errors: Array<{ test: string; error: Error }> = [];

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  beforeEach(fn: () => Promise<void> | void) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn: () => Promise<void> | void) {
    this.afterEachHooks.push(fn);
  }

  beforeAll(fn: () => Promise<void> | void) {
    this.beforeAllHooks.push(fn);
  }

  afterAll(fn: () => Promise<void> | void) {
    this.afterAllHooks.push(fn);
  }

  async run() {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`);

    // Run beforeAll hooks
    for (const hook of this.beforeAllHooks) {
      await hook();
    }

    // Run each test
    for (const test of this.tests) {
      try {
        // Run beforeEach hooks
        for (const hook of this.beforeEachHooks) {
          await hook();
        }

        // Run the test
        await test.fn();

        // Run afterEach hooks
        for (const hook of this.afterEachHooks) {
          await hook();
        }

        this.passedTests++;
        console.log(`✅ ${test.name}`);
      } catch (error) {
        this.failedTests++;
        this.errors.push({ test: test.name, error: error as Error });
        console.log(`❌ ${test.name}`);
      }
    }

    // Run afterAll hooks
    for (const hook of this.afterAllHooks) {
      await hook();
    }

    // Print summary
    this.printSummary();
  }

  private printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total: ${this.tests.length}`);
    console.log(`   ✅ Passed: ${this.passedTests}`);
    console.log(`   ❌ Failed: ${this.failedTests}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.errors.forEach(({ test, error }) => {
        console.log(`\n   ${test}:`);
        console.log(`   ${error.message}`);
        if (error.stack) {
          console.log(
            `   ${error.stack.split('\n').slice(1, 4).join('\n   ')}`,
          );
        }
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Exit with error code if tests failed
    if (this.failedTests > 0) {
      process.exit(1);
    }
  }
}

import fs from 'fs';

// Logger utility for test debugging
export class Logger {
  private static logFile = 'test_run.log';

  private static appendLog(message: string) {
    fs.appendFileSync(Logger.logFile, message + '\n');
    console.log(message);
  }

  static success(label: string, data: any) {
    Logger.appendLog(`\n  ✅ ${label}:`);
    if (data) {
      Logger.appendLog(
        `     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`,
      );
    }
  }

  static info(label: string, data: any) {
    Logger.appendLog(`\n  ℹ️  ${label}:`);
    if (data) {
      Logger.appendLog(
        `     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`,
      );
    }
  }

  static data(label: string, data: any) {
    Logger.appendLog(`\n  📦 ${label}:`);
    if (data) {
      Logger.appendLog(
        `     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`,
      );
    }
  }

  static raw(label: string, data: any) {
    Logger.appendLog(`\n  🔍 ${label} (RAW):`);
    if (data) {
      Logger.appendLog(
        `     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`,
      );
    }
  }

  static step(message: string) {
    Logger.appendLog(`\n  🔹 ${message}`);
  }

  static section(title: string) {
    Logger.appendLog(`\n  ${'─'.repeat(40)}`);
    Logger.appendLog(`  📋 ${title}`);
    Logger.appendLog(`  ${'─'.repeat(40)}`);
  }

  static clearLog() {
    if (fs.existsSync(Logger.logFile)) {
      fs.unlinkSync(Logger.logFile);
    }
  }
}

// Assertion helpers
export class Assert {
  static equal<T>(actual: T, expected: T, message?: string) {
    if (actual !== expected) {
      throw new Error(
        message ||
          `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`,
      );
    }
  }

  static notEqual<T>(actual: T, expected: T, message?: string) {
    if (actual === expected) {
      throw new Error(
        message ||
          `Expected values to be different, but both are ${JSON.stringify(actual)}`,
      );
    }
  }

  static deepEqual<T>(actual: T, expected: T, message?: string) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message || `Expected ${expectedStr} but got ${actualStr}`,
      );
    }
  }

  static isTrue(value: boolean, message?: string) {
    if (value !== true) {
      throw new Error(message || `Expected true but got ${value}`);
    }
  }

  static isFalse(value: boolean, message?: string) {
    if (value !== false) {
      throw new Error(message || `Expected false but got ${value}`);
    }
  }

  static isNull(value: any, message?: string) {
    if (value !== null) {
      throw new Error(
        message || `Expected null but got ${JSON.stringify(value)}`,
      );
    }
  }

  static isNotNull(value: any, message?: string) {
    if (value === null) {
      throw new Error(message || 'Expected value to not be null');
    }
  }

  static isDefined(value: any, message?: string) {
    if (value === undefined) {
      throw new Error(message || 'Expected value to be defined');
    }
  }

  static isUndefined(value: any, message?: string) {
    if (value !== undefined) {
      throw new Error(
        message || `Expected undefined but got ${JSON.stringify(value)}`,
      );
    }
  }

  static async throws(fn: () => Promise<void> | void, message?: string) {
    let didThrow = false;
    try {
      await fn();
    } catch {
      didThrow = true;
    }
    if (!didThrow) {
      throw new Error(message || 'Expected function to throw an error');
    }
  }

  static async doesNotThrow(fn: () => Promise<void> | void, message?: string) {
    try {
      await fn();
    } catch (error) {
      throw new Error(
        message ||
          `Expected function not to throw, but it threw: ${(error as Error).message}`,
      );
    }
  }

  static includes<T>(array: T[], value: T, message?: string) {
    if (!array.includes(value)) {
      throw new Error(
        message || `Expected array to include ${JSON.stringify(value)}`,
      );
    }
  }

  static notIncludes<T>(array: T[], value: T, message?: string) {
    if (array.includes(value)) {
      throw new Error(
        message || `Expected array not to include ${JSON.stringify(value)}`,
      );
    }
  }

  static greaterThan(actual: number, expected: number, message?: string) {
    if (actual <= expected) {
      throw new Error(
        message || `Expected ${actual} to be greater than ${expected}`,
      );
    }
  }

  static lessThan(actual: number, expected: number, message?: string) {
    if (actual >= expected) {
      throw new Error(
        message || `Expected ${actual} to be less than ${expected}`,
      );
    }
  }

  static match(actual: string, pattern: RegExp, message?: string) {
    if (!pattern.test(actual)) {
      throw new Error(
        message || `Expected "${actual}" to match pattern ${pattern}`,
      );
    }
  }
}

// Helper to create test suite
export function createTestSuite(suiteName: string) {
  Logger.clearLog();
  const runner = new TestRunner();

  console.log(`\n📦 Test Suite: ${suiteName}`);

  return {
    test: runner.test.bind(runner),
    beforeEach: runner.beforeEach.bind(runner),
    afterEach: runner.afterEach.bind(runner),
    beforeAll: runner.beforeAll.bind(runner),
    afterAll: runner.afterAll.bind(runner),
    run: runner.run.bind(runner),
  };
}
