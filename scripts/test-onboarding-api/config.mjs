/**
 * Configuration for the onboarding API test suite
 */

// Parse command line arguments
const args = process.argv.slice(2);
let env = 'mock';
let tests = ['auth', 'get', 'post', 'reset', 'edge-cases'];
let verbose = false;

// Process arguments
args.forEach(arg => {
  if (arg.startsWith('--env=') || arg.startsWith('-e=')) {
    env = arg.split('=')[1];
  } else if (arg.startsWith('--tests=') || arg.startsWith('-t=')) {
    tests = arg.split('=')[1].split(',');
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Onboarding API Test Suite

Usage:
  node index.mjs [options]

Options:
  --env, -e     Environment to test (mock or production) [default: mock]
  --tests, -t   Tests to run (comma-separated: auth,get,post,reset,edge-cases) [default: all]
  --verbose, -v Enable verbose logging [default: false]
  --help, -h    Show this help message

Examples:
  node index.mjs
  node index.mjs --env=production
  node index.mjs --tests=auth,get
  node index.mjs --env=production --tests=post,reset --verbose
    `);
    process.exit(0);
  }
});

// Environment configurations
const environments = {
  mock: {
    name: 'Mock API',
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    apiPath: '/api/onboarding-test',
    authEnabled: false,
    testUsers: {
      new: 'test-new-user-id',
      existing: 'test-existing-user-id',
      partial: 'test-partial-user-id',
      complete: 'test-complete-user-id'
    }
  },
  production: {
    name: 'Production API',
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    apiPath: '/api/onboarding',
    authEnabled: true,
    testUsers: {
      new: process.env.TEST_NEW_USER_ID || 'auth0|new-user-id',
      existing: process.env.TEST_EXISTING_USER_ID || 'auth0|existing-user-id',
      partial: process.env.TEST_PARTIAL_USER_ID || 'auth0|partial-user-id',
      complete: process.env.TEST_COMPLETE_USER_ID || 'auth0|complete-user-id'
    }
  }
};

// JWT configuration for testing
const jwtConfig = {
  secret: process.env.JWT_TEST_SECRET || 'test-secret-key',
  expiresIn: '1h'
};

// Export the configuration
export default {
  ...environments[env],
  env,
  tests,
  verbose,
  jwtConfig
};
