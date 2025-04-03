// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Import cypress-axe for accessibility testing
// This ensures the commands are properly registered
import 'cypress-axe';

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// Custom command to login with Auth0
Cypress.Commands.add('loginByAuth0', (username, password) => {
  cy.log('Logging in with Auth0');
  cy.visit('/login');
  cy.get('input[name="email"]').type(username);
  cy.get('input[name="password"]').type(password, { log: false });
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Custom command to check brand consistency
Cypress.Commands.add('checkBrandConsistency', () => {
  // Check for brand colors
  cy.get('header').should('have.css', 'background-color', 'rgb(13, 27, 42)'); // Midnight Blue
  
  // Check for typography
  cy.get('h1, h2, h3').should('have.css', 'font-family').and('include', 'Roboto');
  
  // Check for logo presence
  cy.get('header').find('a').contains('SmartText AI').should('be.visible');
});

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
