/// <reference types="cypress" />

describe('Subscription Management Page', () => {
  beforeEach(() => {
    // Mock login before visiting subscription page
    cy.intercept('GET', '/api/auth/me', { 
      statusCode: 200, 
      body: { 
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        subscription: {
          status: 'active',
          plan: 'pro',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false
        }
      } 
    }).as('getUser');
    
    cy.visit('/dashboard/subscription');
    cy.wait('@getUser');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Subscription');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the subscription heading', () => {
    cy.get('h1').should('contain.text', 'Subscription');
  });

  it('should display current subscription details', () => {
    cy.get('.subscriptionDetails').should('be.visible');
    cy.get('.subscriptionDetails').should('contain.text', 'Pro Plan');
    cy.get('.subscriptionDetails').should('contain.text', 'Active');
  });

  it('should display subscription renewal information', () => {
    cy.get('.renewalInfo').should('be.visible');
    cy.get('.renewalInfo').should('contain.text', 'Your subscription will renew');
  });

  it('should display payment method information', () => {
    cy.get('.paymentMethod').should('be.visible');
    cy.get('.paymentMethod').should('contain.text', 'Payment Method');
  });

  it('should have a "Manage Payment Method" button', () => {
    cy.get('button').contains('Manage Payment Method').should('be.visible');
  });

  it('should have a "Cancel Subscription" button', () => {
    cy.get('button').contains('Cancel Subscription').should('be.visible');
  });

  it('should show confirmation dialog when clicking "Cancel Subscription"', () => {
    cy.get('button').contains('Cancel Subscription').click();
    cy.get('.confirmationDialog').should('be.visible');
    cy.get('.confirmationDialog').should('contain.text', 'Are you sure');
    cy.get('.confirmationDialog').find('button').contains('No, Keep Subscription').should('be.visible');
    cy.get('.confirmationDialog').find('button').contains('Yes, Cancel').should('be.visible');
  });

  it('should close confirmation dialog when clicking "No, Keep Subscription"', () => {
    cy.get('button').contains('Cancel Subscription').click();
    cy.get('.confirmationDialog').find('button').contains('No, Keep Subscription').click();
    cy.get('.confirmationDialog').should('not.exist');
  });

  it('should display plan upgrade options', () => {
    cy.get('.upgradeOptions').should('be.visible');
    cy.get('.planCard').should('have.length.at.least', 1);
  });

  it('should display plan comparison table', () => {
    cy.get('.planComparison').should('be.visible');
    cy.get('.planComparison').find('th').should('have.length.at.least', 3); // Headers for each plan
    cy.get('.planComparison').find('tr').should('have.length.at.least', 5); // At least 5 feature rows
  });

  it('should display billing history', () => {
    cy.get('.billingHistory').should('be.visible');
    cy.get('.billingHistory').find('th').should('contain.text', 'Date');
    cy.get('.billingHistory').find('th').should('contain.text', 'Amount');
    cy.get('.billingHistory').find('th').should('contain.text', 'Status');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('.subscriptionDetails').should('be.visible');
    cy.get('button').contains('Cancel Subscription').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('.subscriptionDetails').should('be.visible');
    cy.get('.planComparison').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
