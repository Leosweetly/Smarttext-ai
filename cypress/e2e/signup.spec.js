/// <reference types="cypress" />

describe('Signup Page', () => {
  beforeEach(() => {
    cy.visit('/signup');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Sign Up');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the signup heading', () => {
    cy.get('h1').should('contain.text', 'Start Your 7-Day Free Trial');
  });

  it('should display plan selection options', () => {
    cy.get('.planOption').should('have.length', 3);
    cy.get('.planOption').eq(0).should('contain.text', 'Basic');
    cy.get('.planOption').eq(1).should('contain.text', 'Pro');
    cy.get('.planOption').eq(2).should('contain.text', 'Enterprise');
  });

  it('should have the correct pricing information', () => {
    cy.get('.planOption').eq(0).find('.planPrice').should('contain.text', '$249/mo');
    cy.get('.planOption').eq(1).find('.planPrice').should('contain.text', '$399/mo');
    cy.get('.planOption').eq(2).find('.planPrice').should('contain.text', '$599+/mo');
  });

  it('should allow selecting different plans', () => {
    // Basic plan should be selected by default
    cy.get('.planOption').eq(0).should('have.class', 'selectedPlan');
    
    // Select Pro plan
    cy.get('.planOption').eq(1).click();
    cy.get('.planOption').eq(1).should('have.class', 'selectedPlan');
    
    // Select Enterprise plan
    cy.get('.planOption').eq(2).click();
    cy.get('.planOption').eq(2).should('have.class', 'selectedPlan');
  });

  it('should have terms and conditions checkbox', () => {
    cy.get('input[name="agreeToTerms"]').should('exist');
    cy.get('label[for="agreeToTerms"]').should('contain.text', 'Terms of Service');
    cy.get('label[for="agreeToTerms"]').should('contain.text', 'Privacy Policy');
  });

  it('should have links to terms and privacy pages', () => {
    cy.get('a[href="/terms"]').should('be.visible');
    cy.get('a[href="/privacy"]').should('be.visible');
  });

  it('should show error when trying to sign up without agreeing to terms', () => {
    cy.get('button').contains('Continue to Create Account').click();
    cy.get('.errorAlert').should('be.visible');
    cy.get('.errorAlert').should('contain.text', 'agree to the terms');
  });

  it('should have social signup options', () => {
    cy.get('button').contains('Continue with Google').should('be.visible');
  });

  it('should have a login link', () => {
    cy.get('a[href="/login"]').should('be.visible');
    cy.get('.loginLink').should('contain.text', 'Already have an account?');
  });

  it('should navigate to login page when login link is clicked', () => {
    cy.get('a[href="/login"]').click();
    cy.url().should('include', '/login');
  });

  it('should pre-select plan based on URL parameter', () => {
    cy.visit('/signup?plan=pro');
    cy.get('.planOption').eq(1).should('have.class', 'selectedPlan');
    
    cy.visit('/signup?plan=enterprise');
    cy.get('.planOption').eq(2).should('have.class', 'selectedPlan');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('.planOption').should('be.visible');
    cy.get('button').contains('Continue to Create Account').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('.planOption').should('be.visible');
    cy.get('button').contains('Continue to Create Account').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
