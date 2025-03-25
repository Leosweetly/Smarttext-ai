# Onboarding Flow Implementation

This document describes the implementation of the onboarding flow in the SmartText AI application.

## Overview

The onboarding flow is a step-by-step process that guides users through setting up their account and configuring their business settings. The flow consists of three main steps:

1. **Business Information**: Collect basic information about the business (name, type, address)
2. **Phone Setup**: Configure phone number and settings
3. **Preferences**: Set user preferences for notifications, auto-responses, and theme

## Implementation Details

### Frontend Components

The onboarding flow is implemented using the following components:

- **OnboardingProvider**: A context provider that makes onboarding state available throughout the application
- **useOnboarding**: A hook that provides methods for managing onboarding state
- **useOnboardingApi**: A hook for interacting with the onboarding API endpoints
- **OnboardingBanner**: A UI component that reminds users to complete onboarding
- **SetupChecklist**: A UI component that shows progress through the onboarding steps

### State Management

Onboarding state is managed using a combination of:

1. **Local Storage**: For offline and persistent storage
2. **API Integration**: For server-side persistence and future backend integration

The onboarding state structure is:

```javascript
{
  steps: {
    businessInfo: {
      completed: boolean,
      data: {
        name: string,
        businessType: string,
        address: string
      }
    },
    phoneSetup: {
      completed: boolean,
      data: {
        phoneNumber: string,
        configured: boolean
      }
    },
    preferences: {
      completed: boolean,
      data: {
        notifications: boolean,
        autoRespond: boolean,
        theme: string
      }
    }
  },
  currentStep: 'businessInfo' | 'phoneSetup' | 'preferences',
  completed: boolean,
  lastUpdated: string // ISO date string
}
```

### API Endpoints

The application includes mock API endpoints for onboarding data:

- **GET /api/onboarding-test**: Retrieve current onboarding state
- **POST /api/onboarding-test**: Save onboarding data
- **POST /api/onboarding-test/reset**: Reset onboarding progress

These endpoints currently use in-memory storage but are designed to be easily updated to connect to a real backend in the future.

### Integration with Authentication

The onboarding flow is integrated with the authentication system:

- Onboarding state is associated with the user's ID
- The `useOnboarding` hook retrieves the user ID from the authentication context
- When a user logs in, their onboarding state is retrieved from the API

## Future Backend Integration

To integrate with a real backend in the future:

1. Update the API endpoints in `app/api/onboarding` to connect to your database
2. Modify the `useOnboardingApi` hook to include authentication tokens in requests
3. Implement server-side validation for onboarding data

## Testing

The onboarding flow can be tested using:

- **scripts/test-onboarding-flow.mjs**: Tests the complete onboarding flow
- **scripts/test-onboarding-api.mjs**: Tests the API endpoints

## Usage Example

```javascript
// In a component
import { useOnboardingContext } from '@/lib/onboarding/context';

function OnboardingStep() {
  const { 
    onboardingState, 
    updateStepData, 
    completeStep, 
    goToStep 
  } = useOnboardingContext();
  
  const { currentStep, steps } = onboardingState;
  
  // Update step data
  const handleChange = (e) => {
    updateStepData(currentStep, {
      [e.target.name]: e.target.value
    });
  };
  
  // Mark step as completed and move to next step
  const handleNext = () => {
    completeStep(currentStep);
  };
  
  return (
    <div>
      {/* Render step UI based on currentStep */}
    </div>
  );
}
