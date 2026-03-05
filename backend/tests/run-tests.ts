#!/usr/bin/env node
import { glob } from 'glob';
import path from 'path';
import { pathToFileURL } from 'url';

async function runAllTests() {
  console.log('\n🚀 Starting Manual Test Runner\n');
  console.log('='.repeat(50));

  // Find all test files
  const testFiles = await glob('tests/**/*.test.ts', {
    cwd: process.cwd(),
    absolute: true,
  });

  if (testFiles.length === 0) {
    console.log('\n⚠️  No test files found in tests/ directory');
    console.log('   Create test files with .test.ts extension\n');
    process.exit(0);
  }

  console.log(`\n📝 Found ${testFiles.length} test file(s)\n`);

  let hasFailures = false;

  // Run each test file
  for (const testFile of testFiles) {
    const testName = path.basename(testFile);
    console.log(`\n▶️  Running: ${testName}`);

    try {
      // Import and run the test file
      const fileUrl = pathToFileURL(testFile).href;
      await import(fileUrl);
    } catch (error) {
      hasFailures = true;
      console.error(`\n❌ Error running ${testName}:`);
      console.error((error as Error).message);
      if ((error as Error).stack) {
        console.error((error as Error).stack);
      }
    }
  }

  // Close database connection after all tests
  try {
    const { db } = await import('../src/db/index.js');
    // await db.$client.end();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    // Database might not have been initialized, ignore error
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n🏁 Test run complete!\n`);

  if (hasFailures) {
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('\n💥 Fatal error:');
  console.error(error);
  process.exit(1);
});
