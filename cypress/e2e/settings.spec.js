/// <reference types="cypress" />

describe('Settings Page', () => {
  beforeEach(() => {
    // Mock login before visiting settings page
    cy.intercept('GET', '/api/auth/me', { 
      statusCode: 200, 
      body: { 
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1 (555) 123-4567',
        businessName: 'Test Business',
        businessType: 'restaurant',
        subscription: {
          status: 'active',
          plan: 'pro'
        }
      } 
    }).as('getUser');
    
    // Mock Airtable connection status
    cy.intercept('GET', '/api/auth/airtable/status', {
      statusCode: 200,
      body: {
        connected: true,
        workspaces: [
          { id: 'workspace1', name: 'Main Workspace' }
        ],
        bases: [
          { id: 'base1', name: 'Customer Database' }
        ]
      }
    }).as('getAirtableStatus');
    
    cy.visit('/dashboard/settings');
    cy.wait('@getUser');
    cy.wait('@getAirtableStatus');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Settings');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the settings heading', () => {
    cy.get('h1').should('contain.text', 'Settings');
  });

  it('should display user profile section', () => {
    cy.get('.profileSection').should('be.visible');
    cy.get('.profileSection').should('contain.text', 'Profile');
  });

  it('should display user information in form fields', () => {
    cy.get('input[name="name"]').should('have.value', 'Test User');
    cy.get('input[name="email"]').should('have.value', 'test@example.com');
    cy.get('input[name="phone"]').should('have.value', '+1 (555) 123-4567');
    cy.get('input[name="businessName"]').should('have.value', 'Test Business');
  });

  it('should have a "Save Changes" button for profile', () => {
    cy.get('.profileSection').find('button').contains('Save Changes').should('be.visible');
  });

  it('should display Airtable integration section', () => {
    cy.get('.airtableSection').should('be.visible');
    cy.get('.airtableSection').should('contain.text', 'Airtable Integration');
  });

  it('should display Airtable connection status', () => {
    cy.get('.airtableConnectionStatus').should('be.visible');
    cy.get('.airtableConnectionStatus').should('contain.text', 'Connected');
  });

  it('should display connected Airtable workspace and base', () => {
    cy.get('.airtableWorkspace').should('contain.text', 'Main Workspace');
    cy.get('.airtableBase').should('contain.text', 'Customer Database');
  });

  it('should have a "Disconnect" button for Airtable', () => {
    cy.get('.airtableSection').find('button').contains('Disconnect').should('be.visible');
  });

  it('should display notification preferences section', () => {
    cy.get('.notificationsSection').should('be.visible');
    cy.get('.notificationsSection').should('contain.text', 'Notification Preferences');
  });

  it('should have email notification toggles', () => {
    cy.get('input[name="emailNotifications"]').should('exist');
    cy.get('input[name="marketingEmails"]').should('exist');
  });

  it('should display security section', () => {
    cy.get('.securitySection').should('be.visible');
    cy.get('.securitySection').should('contain.text', 'Security');
  });

  it('should have a "Change Password" button', () => {
    cy.get('.securitySection').find('button').contains('Change Password').should('be.visible');
  });

  it('should display change password form when button is clicked', () => {
    cy.get('.securitySection').find('button').contains('Change Password').click();
    cy.get('input[name="currentPassword"]').should('be.visible');
    cy.get('input[name="newPassword"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
  });

  it('should display data management section', () => {
    cy.get('.dataSection').should('be.visible');
    cy.get('.dataSection').should('contain.text', 'Data Management');
  });

  it('should have a "Delete Account" button', () => {
    cy.get('.dataSection').find('button').contains('Delete Account').should('be.visible');
  });

  it('should show confirmation dialog when clicking "Delete Account"', () => {
    cy.get('.dataSection').find('button').contains('Delete Account').click();
    cy.get('.confirmationDialog').should('be.visible');
    cy.get('.confirmationDialog').should('contain.text', 'Are you sure');
    cy.get('.confirmationDialog').find('button').contains('Cancel').should('be.visible');
    cy.get('.confirmationDialog').find('button').contains('Delete').should('be.visible');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('.profileSection').should('be.visible');
    cy.get('.airtableSection').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('.profileSection').should('be.visible');
    cy.get('.airtableSection').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
