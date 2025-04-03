const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Check if we're running in CI
      const isCI = process.env.CYPRESS_CI === 'true';
      
      if (isCI) {
        // CI-specific configurations
        config.retries = {
          runMode: 2,
          openMode: 0
        };
        config.video = false;
        
        // Pass environment variables to Cypress
        config.env = {
          ...config.env,
          CI: true,
          AIRTABLE_PAT: process.env.AIRTABLE_PAT,
          AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID
        };
      }
      
      return config;
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: false,
  // Increase timeout for CI environments
  defaultCommandTimeout: 10000,
  // Add retry ability
  retries: {
    runMode: 1,
    openMode: 0
  },
});
