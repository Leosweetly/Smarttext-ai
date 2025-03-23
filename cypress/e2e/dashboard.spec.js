/// <reference types="cypress" />

describe('Dashboard Page', () => {
  beforeEach(() => {
    // Mock login before visiting dashboard
    cy.intercept('GET', '/api/auth/me', { 
      statusCode: 200, 
      body: { 
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        subscription: {
          status: 'active',
          plan: 'pro'
        }
      } 
    }).as('getUser');
    
    cy.visit('/dashboard');
    cy.wait('@getUser');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Dashboard');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the dashboard heading', () => {
    cy.get('h1').should('contain.text', 'Dashboard');
  });

  it('should display user information', () => {
    cy.get('.userInfo').should('contain.text', 'Test User');
    cy.get('.userInfo').should('contain.text', 'test@example.com');
  });

  it('should display subscription status', () => {
    cy.get('.subscriptionStatus').should('contain.text', 'Pro Plan');
    cy.get('.subscriptionStatus').should('contain.text', 'Active');
  });

  it('should display business metrics', () => {
    cy.get('.metricsCard').should('have.length.at.least', 3);
    cy.get('.metricsCard').eq(0).should('contain.text', 'Calls');
    cy.get('.metricsCard').eq(1).should('contain.text', 'Messages');
    cy.get('.metricsCard').eq(2).should('contain.text', 'Responses');
  });

  it('should display recent activity', () => {
    cy.get('.activityFeed').should('exist');
    cy.get('.activityItem').should('have.length.at.least', 1);
  });

  it('should have navigation sidebar', () => {
    cy.get('.sidebar').should('be.visible');
    cy.get('.sidebar').find('a[href="/dashboard"]').should('be.visible');
    cy.get('.sidebar').find('a[href="/dashboard/subscription"]').should('be.visible');
    cy.get('.sidebar').find('a[href="/dashboard/settings"]').should('be.visible');
  });

  it('should highlight the current page in the sidebar', () => {
    cy.get('.sidebar').find('a[href="/dashboard"]').should('have.class', 'active');
  });

  it('should navigate to subscription page when subscription link is clicked', () => {
    cy.get('.sidebar').find('a[href="/dashboard/subscription"]').click();
    cy.url().should('include', '/dashboard/subscription');
  });

  it('should navigate to settings page when settings link is clicked', () => {
    cy.get('.sidebar').find('a[href="/dashboard/settings"]').click();
    cy.url().should('include', '/dashboard/settings');
  });

  it('should have a logout button', () => {
    cy.get('button').contains('Logout').should('be.visible');
  });

  it('should display Airtable connection status', () => {
    cy.get('.airtableStatus').should('exist');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('.metricsCard').should('be.visible');
    cy.get('.hamburgerMenu').should('be.visible'); // Mobile menu toggle
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('.metricsCard').should('be.visible');
    cy.get('.sidebar').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
