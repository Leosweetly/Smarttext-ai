/// <reference types="cypress" />

describe('Industry-Specific Pages', () => {
  describe('Restaurants Page', () => {
    beforeEach(() => {
      cy.visit('/restaurants');
      cy.injectAxe(); // If using axe for accessibility testing
    });

    it('should display the correct title', () => {
      cy.title().should('include', 'Restaurant');
    });

    it('should have proper brand consistency', () => {
      cy.checkBrandConsistency();
    });

    it('should display the restaurant-specific heading', () => {
      cy.get('h1').should('contain.text', 'SmartText AI for Restaurants');
    });

    it('should display restaurant-specific benefits', () => {
      cy.get('.benefitsSection').should('be.visible');
      cy.get('.benefitCard').should('have.length.at.least', 3);
    });

    it('should display restaurant-specific features', () => {
      cy.get('.featuresSection').should('be.visible');
      cy.get('.featureItem').should('have.length.at.least', 3);
    });

    it('should display restaurant testimonials', () => {
      cy.get('.testimonialsSection').should('be.visible');
      cy.get('.testimonialCard').should('have.length.at.least', 1);
      cy.get('.testimonialCard').should('contain.text', 'restaurant');
    });

    it('should display restaurant-specific FAQ section', () => {
      cy.get('.faqSection').should('be.visible');
      cy.get('.faqItem').should('have.length.at.least', 3);
    });

    it('should have a call-to-action button', () => {
      cy.get('a').contains('Start Free Trial').should('be.visible');
    });

    it('should navigate to signup page when CTA is clicked', () => {
      cy.get('a').contains('Start Free Trial').click();
      cy.url().should('include', '/signup');
      cy.url().should('include', 'industry=restaurant');
    });

    it('should have proper mobile responsiveness', () => {
      // Test on mobile viewport
      cy.viewport('iphone-x');
      cy.get('.benefitCard').should('be.visible');
      cy.get('a').contains('Start Free Trial').should('be.visible');
      
      // Test on tablet viewport
      cy.viewport('ipad-2');
      cy.get('.benefitCard').should('be.visible');
      cy.get('a').contains('Start Free Trial').should('be.visible');
    });

    it('should pass basic accessibility tests', () => {
      cy.checkA11y(); // If using axe for accessibility testing
    });
  });

  describe('Auto Shops Page', () => {
    beforeEach(() => {
      cy.visit('/autoshops');
      cy.injectAxe(); // If using axe for accessibility testing
    });

    it('should display the correct title', () => {
      cy.title().should('include', 'Auto Shop');
    });

    it('should have proper brand consistency', () => {
      cy.checkBrandConsistency();
    });

    it('should display the auto shop-specific heading', () => {
      cy.get('h1').should('contain.text', 'SmartText AI for Auto Shops');
    });

    it('should display auto shop-specific benefits', () => {
      cy.get('.benefitsSection').should('be.visible');
      cy.get('.benefitCard').should('have.length.at.least', 3);
    });

    it('should display auto shop-specific features', () => {
      cy.get('.featuresSection').should('be.visible');
      cy.get('.featureItem').should('have.length.at.least', 3);
    });

    it('should display auto shop testimonials', () => {
      cy.get('.testimonialsSection').should('be.visible');
      cy.get('.testimonialCard').should('have.length.at.least', 1);
      cy.get('.testimonialCard').should('contain.text', 'auto');
    });

    it('should display auto shop-specific FAQ section', () => {
      cy.get('.faqSection').should('be.visible');
      cy.get('.faqItem').should('have.length.at.least', 3);
    });

    it('should have a call-to-action button', () => {
      cy.get('a').contains('Start Free Trial').should('be.visible');
    });

    it('should navigate to signup page when CTA is clicked', () => {
      cy.get('a').contains('Start Free Trial').click();
      cy.url().should('include', '/signup');
      cy.url().should('include', 'industry=autoshop');
    });

    it('should have proper mobile responsiveness', () => {
      // Test on mobile viewport
      cy.viewport('iphone-x');
      cy.get('.benefitCard').should('be.visible');
      cy.get('a').contains('Start Free Trial').should('be.visible');
      
      // Test on tablet viewport
      cy.viewport('ipad-2');
      cy.get('.benefitCard').should('be.visible');
      cy.get('a').contains('Start Free Trial').should('be.visible');
    });

    it('should pass basic accessibility tests', () => {
      cy.checkA11y(); // If using axe for accessibility testing
    });
  });
});
