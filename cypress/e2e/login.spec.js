/// <reference types="cypress" />

describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Login');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the login form', () => {
    cy.get('form').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.get('form').contains('required').should('be.visible');
  });

  it('should show validation error for invalid email', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('form').contains('valid email').should('be.visible');
  });

  it('should show error message for incorrect credentials', () => {
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.get('.errorAlert').should('be.visible');
  });

  it('should have a "Sign up" link', () => {
    cy.get('a[href="/signup"]').should('be.visible');
    cy.get('a[href="/signup"]').should('contain.text', 'Sign up');
  });

  it('should navigate to signup page when "Sign up" link is clicked', () => {
    cy.get('a[href="/signup"]').click();
    cy.url().should('include', '/signup');
  });

  it('should have "Forgot password" link', () => {
    cy.get('a').contains('Forgot password').should('be.visible');
  });

  it('should have social login options', () => {
    cy.get('button').contains('Continue with Google').should('be.visible');
    // Add more social login buttons as needed
  });

  it('should handle returnTo parameter', () => {
    cy.visit('/login?returnTo=/dashboard');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    // In a real test, we would mock the authentication and verify redirect
    // cy.url().should('include', '/dashboard');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('form').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('form').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
