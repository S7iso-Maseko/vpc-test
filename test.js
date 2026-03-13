// Simple test file
const { greet, add } = require('./index');

console.log('Running tests...');

// Test 1: greet function
const greeting = greet('World');
if (greeting === 'Hello, World!') {
  console.log('✓ Test 1 passed: greet function works');
} else {
  console.error('✗ Test 1 failed: greet function');
  process.exit(1);
}

// Test 2: add function
const sum = add(2, 3);
if (sum === 5) {
  console.log('✓ Test 2 passed: add function works');
} else {
  console.error('✗ Test 2 failed: add function');
  process.exit(1);
}

console.log('All tests passed!');
