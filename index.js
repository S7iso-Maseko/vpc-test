// Simple Node.js application
function greet(name) {
  return `Hello, ${name}!`;
}

function add(a, b) {
  return a + b;
}

module.exports = { greet, add };

// Run if executed directly
if (require.main === module) {
  console.log(greet('CodeBuild'));
  console.log('2 + 3 =', add(2, 3));
}
