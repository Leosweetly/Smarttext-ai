/**
 * Validation utilities for the onboarding API test suite
 */

import config from '../config.mjs';

/**
 * Check if a response is successful
 * @param {Object} response - The response object
 * @returns {boolean} Whether the response is successful
 */
export function isSuccessful(response) {
  return (
    response.status >= 200 &&
    response.status < 300 &&
    response.data &&
    response.data.success !== false
  );
}

/**
 * Check if a response is an error
 * @param {Object} response - The response object
 * @returns {boolean} Whether the response is an error
 */
export function isError(response) {
  return (
    response.status < 200 ||
    response.status >= 300 ||
    (response.data && response.data.success === false)
  );
}

/**
 * Validate a response against a schema
 * @param {Object} response - The response object
 * @param {string} schemaName - The name of the schema to validate against
 * @returns {Object} Validation result with success and errors
 */
export function validateResponse(response, schemaName) {
  // Skip validation if response is an error
  if (isError(response)) {
    return { success: true };
  }
  
  // Get the schema
  const schema = schemas[schemaName];
  
  if (!schema) {
    return {
      success: false,
      errors: [`Schema '${schemaName}' not found`]
    };
  }
  
  // Validate the response
  const errors = [];
  
  // Check required fields
  for (const field of schema.required) {
    if (response.data[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check field types
  for (const [field, type] of Object.entries(schema.types)) {
    if (response.data[field] !== undefined) {
      if (!validateType(response.data[field], type)) {
        errors.push(`Invalid type for field ${field}: expected ${type}, got ${typeof response.data[field]}`);
      }
    }
  }
  
  // Check nested fields
  for (const [field, nestedSchema] of Object.entries(schema.nested || {})) {
    if (response.data[field] !== undefined) {
      const nestedErrors = validateNestedField(response.data[field], nestedSchema);
      errors.push(...nestedErrors.map(error => `${field}.${error}`));
    }
  }
  
  return {
    success: errors.length === 0,
    errors
  };
}

/**
 * Validate a nested field against a schema
 * @param {Object} data - The data to validate
 * @param {Object} schema - The schema to validate against
 * @returns {Array} Validation errors
 */
function validateNestedField(data, schema) {
  const errors = [];
  
  // Check required fields
  for (const field of schema.required || []) {
    if (data[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check field types
  for (const [field, type] of Object.entries(schema.types || {})) {
    if (data[field] !== undefined) {
      if (!validateType(data[field], type)) {
        errors.push(`Invalid type for field ${field}: expected ${type}, got ${typeof data[field]}`);
      }
    }
  }
  
  // Check nested fields
  for (const [field, nestedSchema] of Object.entries(schema.nested || {})) {
    if (data[field] !== undefined) {
      const nestedErrors = validateNestedField(data[field], nestedSchema);
      errors.push(...nestedErrors.map(error => `${field}.${error}`));
    }
  }
  
  return errors;
}

/**
 * Validate a value against a type
 * @param {*} value - The value to validate
 * @param {string} type - The type to validate against
 * @returns {boolean} Whether the value is valid
 */
function validateType(value, type) {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    case 'date':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    case 'any':
      return true;
    default:
      return false;
  }
}

/**
 * Response schemas for validation
 */
const schemas = {
  // GET /api/onboarding
  getOnboarding: {
    required: ['userId', 'steps', 'currentStep', 'completed'],
    types: {
      userId: 'string',
      currentStep: 'string',
      completed: 'boolean',
      lastUpdated: 'date'
    },
    nested: {
      steps: {
        required: ['businessInfo', 'phoneSetup', 'preferences'],
        nested: {
          businessInfo: {
            required: ['completed'],
            types: {
              completed: 'boolean'
            },
            nested: {
              data: {
                types: {
                  name: 'string',
                  businessType: 'string',
                  address: 'string'
                }
              }
            }
          },
          phoneSetup: {
            required: ['completed'],
            types: {
              completed: 'boolean'
            },
            nested: {
              data: {
                types: {
                  phoneNumber: 'string',
                  configured: 'boolean'
                }
              }
            }
          },
          preferences: {
            required: ['completed'],
            types: {
              completed: 'boolean'
            },
            nested: {
              data: {
                types: {
                  notifications: 'boolean',
                  autoRespond: 'boolean',
                  theme: 'string'
                }
              }
            }
          }
        }
      }
    }
  },
  
  // POST /api/onboarding
  postOnboarding: {
    required: ['success'],
    types: {
      success: 'boolean'
    },
    nested: {
      data: {
        required: ['userId', 'steps', 'currentStep', 'completed'],
        types: {
          userId: 'string',
          currentStep: 'string',
          completed: 'boolean',
          lastUpdated: 'date'
        }
      }
    }
  },
  
  // POST /api/onboarding/reset
  resetOnboarding: {
    required: ['success'],
    types: {
      success: 'boolean'
    }
  }
};

export default { isSuccessful, isError, validateResponse };
