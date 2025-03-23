/// <reference types="cypress" />

describe('Pricing Page', () => {
  beforeEach(() => {
    cy.visit('/pricing');
    cy.injectAxe(); // If using axe for accessibility testing
  });

  it('should display the correct title', () => {
    cy.title().should('include', 'Pricing');
  });

  it('should have proper brand consistency', () => {
    cy.checkBrandConsistency();
  });

  it('should display the pricing heading', () => {
    cy.get('h1').should('contain.text', 'Pricing');
  });

  it('should display three pricing plans', () => {
    cy.get('.pricingCard').should('have.length', 3);
    cy.get('.pricingCard').eq(0).should('contain.text', 'Basic');
    cy.get('.pricingCard').eq(1).should('contain.text', 'Pro');
    cy.get('.pricingCard').eq(2).should('contain.text', 'Enterprise');
  });

  it('should display correct pricing information', () => {
    cy.get('.pricingCard').eq(0).find('.price .amount').should('contain.text', '$249');
    cy.get('.pricingCard').eq(1).find('.price .amount').should('contain.text', '$399');
    cy.get('.pricingCard').eq(2).find('.price .amount').should('contain.text', '$599+');
  });

  it('should highlight the most popular plan', () => {
    cy.get('.pricingCard.featured').should('exist');
    cy.get('.pricingCard.featured').should('contain.text', 'Pro');
    cy.get('.popularBadge').should('contain.text', 'Most Popular');
  });

  it('should have "Start Free Trial" buttons for each plan', () => {
    cy.get('.pricingCard').eq(0).find('a').should('contain.text', 'Start Free Trial');
    cy.get('.pricingCard').eq(1).find('a').should('contain.text', 'Start Free Trial');
    cy.get('.pricingCard').eq(2).find('a').should('contain.text', 'Start Free Trial');
  });

  it('should navigate to signup page with correct plan parameter when clicking on a plan', () => {
    cy.get('.pricingCard').eq(0).find('a').click();
    cy.url().should('include', '/signup?plan=basic');
  });

  it('should display FAQ section', () => {
    cy.get('.faq').should('exist');
    cy.get('.faqItem').should('have.length.at.least', 2);
  });

  it('should have proper mobile responsiveness', () => {
    // Test on mobile viewport
    cy.viewport('iphone-x');
    cy.get('.pricingCard').should('be.visible');
    
    // Test on tablet viewport
    cy.viewport('ipad-2');
    cy.get('.pricingCard').should('be.visible');
  });

  it('should pass basic accessibility tests', () => {
    cy.checkA11y(); // If using axe for accessibility testing
  });
});
