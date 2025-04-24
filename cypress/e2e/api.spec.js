/// <reference types="cypress" />

describe('API Endpoints', () => {
  it('should create a new business record via /api/update-business-info', () => {
    // Skip this test if Airtable credentials are not available
    if (cy.skipIfNoAirtable()) {
      return;
    }
    
    const testData = {
      name: `Test Business ${new Date().toISOString()}`,
      industry: 'Technology',
      size: 'Small',
      website: 'https://example.com'
    };
    
    cy.request({
      method: 'POST',
      url: '/api/update-business-info',
      body: testData
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('id').and.to.be.a('string');
    });
  });
  
  it('should create a new business record via /api/update-business-info-v2', () => {
    // Skip this test if Airtable credentials are not available
    if (cy.skipIfNoAirtable()) {
      return;
    }
    
    const testData = {
      name: `Test Business V2 ${new Date().toISOString()}`,
      industry: 'Technology',
      size: 'Small',
      website: 'https://example.com'
    };
    
    cy.request({
      method: 'POST',
      url: '/api/update-business-info-v2',
      body: testData
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('id').and.to.be.a('string');
    });
  });
  
  it('should update an existing business record', () => {
    // Skip this test if Airtable credentials are not available
    if (cy.skipIfNoAirtable()) {
      return;
    }
    
    // First create a record
    const testData = {
      name: `Test Business for Update ${new Date().toISOString()}`,
      industry: 'Technology',
      size: 'Small',
      website: 'https://example.com'
    };
    
    cy.request({
      method: 'POST',
      url: '/api/update-business-info',
      body: testData
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('id').and.to.be.a('string');
      
      const recordId = response.body.id;
      
      // Now update the record
      const updateData = {
        ...testData,
        name: `${testData.name} (Updated)`,
        recordId
      };
      
      cy.request({
        method: 'POST',
        url: '/api/update-business-info',
        body: updateData
      }).then((updateResponse) => {
        expect(updateResponse.status).to.eq(200);
        expect(updateResponse.body).to.have.property('success', true);
        expect(updateResponse.body).to.have.property('id', recordId);
      });
    });
  });
  
  it('should handle missing required fields', () => {
    cy.request({
      method: 'POST',
      url: '/api/update-business-info',
      body: {
        // Missing required fields
        website: 'https://example.com'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('error', 'Missing required fields');
    });
  });
});
