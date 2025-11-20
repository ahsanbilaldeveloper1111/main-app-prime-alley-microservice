/**
 * Test runner script that runs all test files in the __tests__ directory
 * Usage: node src/__tests__/run-all-tests.js [--export=true]
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Get command-line arguments (pass through to test files)
const args = process.argv.slice(2);

// Find all test files
const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(file => file.endsWith('.test.js'))
  .map(file => path.join(testDir, file))
  .sort(); // Sort for consistent execution order

if (testFiles.length === 0) {
  console.log('No test files found in', testDir);
  process.exit(1);
}

console.log(`Found ${testFiles.length} test file(s):`);
testFiles.forEach(file => console.log(`  - ${path.basename(file)}`));
console.log('');

// Run each test file sequentially
let currentIndex = 0;
let hasFailures = false;

function runNextTest() {
  if (currentIndex >= testFiles.length) {
    // All tests completed
    console.log('\n' + '='.repeat(80));
    console.log('All test files completed');
    console.log('='.repeat(80));
    process.exit(hasFailures ? 1 : 0);
    return;
  }

  const testFile = testFiles[currentIndex];
  const testName = path.basename(testFile);
  
  console.log('\n' + '='.repeat(80));
  console.log(`Running: ${testName}`);
  console.log('='.repeat(80));

  // Spawn node process to run the test file
  const testProcess = spawn('node', [testFile, ...args], {
    stdio: 'inherit',
    shell: false
  });

  testProcess.on('close', (code) => {
    if (code !== 0) {
      hasFailures = true;
      console.log(`\n✗ ${testName} failed with exit code ${code}`);
    } else {
      console.log(`\n✓ ${testName} completed successfully`);
    }
    
    currentIndex++;
    runNextTest();
  });

  testProcess.on('error', (error) => {
    console.error(`\n✗ Error running ${testName}:`, error.message);
    hasFailures = true;
    currentIndex++;
    runNextTest();
  });
}

// Start running tests
runNextTest();

