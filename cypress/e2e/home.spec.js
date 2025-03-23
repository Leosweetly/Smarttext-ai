/// <reference types="cypress" />

describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'SmartText AI');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should have a visible hero section', () => {
    cy.get('h1').should('be.visible');
    cy.get('h1').should('contain.text', 'SmartText AI');
  });

  it('should have navigation links to other pages', () => {
    cy.get('a[href="/pricing"]').should('be.visible');
    cy.get('a[href="/login"]').should('be.visible');
    cy.get('a[href="/signup"]').should('be.visible');
  });

  it('should navigate to pricing page when pricing link is clicked', () => {
    cy.get('a[href="/pricing"]').click();
    cy.url().should('include', '/pricing');
  });

  it('should have proper SEO meta tags', () => {
    cy.get('head meta[name="description"]').should('exist');
    cy.get('head meta[name="keywords"]').should('exist');
  });

  it('should have proper heading hierarchy', () => {
    cy.get('h1').should('exist');
    cy.get('h2').should('exist');
  });

  it('should have a call-to-action button', () => {
    cy.get('a').contains('Get Started').should('be.visible');
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('h1').should('be.visible');
    cy.get('a').contains('Get Started').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('h1').should('be.visible');
    cy.get('a').contains('Get Started').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
