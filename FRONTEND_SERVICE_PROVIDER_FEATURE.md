# Service Provider Creation with Custom Credentials

This document explains the new feature that allows hotel administrators to create service providers with custom login credentials.

## Overview

Hotel administrators can now add new service providers to their platform with two options for user account creation:

1. **Auto-generate credentials** (Default) - The system creates random email and password
2. **Custom credentials** - Hotel admin provides specific email, password, and user details

## Frontend Implementation

### Components

1. **AddServiceProviderModal** (`frontend/src/components/hotel/AddServiceProviderModal.js`)
   - Modal component for creating new service providers
   - Handles both auto-generated and custom credentials
   - Includes form validation and error handling
   - Shows success message with confirmation

2. **ServiceProvidersPage** (`frontend/src/pages/hotel/ServiceProvidersPage.js`)
   - Updated to include "Add New Provider" button
   - Integrates the AddServiceProviderModal component
   - Refreshes provider list after successful creation

### Redux Integration

The feature uses Redux for state management:

- **Action**: `createServiceProvider` in `serviceSlice.js`
- **Service**: `hotelService.createServiceProvider()` API call
- **State Management**: Handles loading states and error handling

## API Integration

### Backend Endpoint
```
POST /api/hotel/service-providers
```

### Request Payload
```javascript
{
  // Business Information (Required)
  businessName: "Business Name",
  description: "Business description",
  category: "LAUNDRY|TRANSPORTATION|TOURISM|FOOD|WELLNESS",
  contactEmail: "business@example.com",
  contactPhone: "+1234567890",
  address: "Business address",

  // Custom User Credentials (Optional)
  userCredentials: {
    email: "user@example.com",
    password: "userPassword",
    firstName: "First",
    lastName: "Last"
  },

  // Options
  sendEmail: true  // Whether to send credentials via email
}
```

### Response
```javascript
{
  success: true,
  message: "Service provider created successfully",
  data: {
    serviceProvider: { /* ServiceProvider object */ },
    user: { /* User object */ },
    credentials: {
      email: "generated@example.com",
      password: "generatedPassword"  // Only if auto-generated
    }
  }
}
```

## Features

### Auto-Generated Credentials (Default)
- System generates random email in format: `provider-{randomId}@{hotelDomain}`
- System generates secure random password (8 characters)
- Email and password sent to contact email if `sendEmail: true`

### Custom Credentials
- Hotel admin provides specific email and password
- Additional validation for email uniqueness
- Password must be at least 6 characters
- First name and last name required for user profile

### Form Validation
- Business name (required)
- Category selection (required)
- Contact email (required, valid email format)
- Contact phone (required)
- If custom credentials:
  - User email (required, valid email format)
  - Password (required, minimum 6 characters)
  - First name (required)
  - Last name (required)

### User Experience
- Clean, responsive modal design
- Loading states during creation
- Success message with confirmation
- Error handling with specific error messages
- Form resets after successful creation
- Auto-close modal after success message

## Usage Example

### Hotel Admin Workflow
1. Navigate to Service Providers page
2. Click "Add New Provider" button
3. Fill out business information
4. Choose credential option:
   - Keep "Auto-generate login credentials" checked for automatic
   - Uncheck to provide custom email/password
5. Submit form
6. See success message and confirmation

### Integration with Existing System
- New service providers appear in the providers list immediately
- Markup settings can be configured for new providers
- All existing provider management features work with new providers
- Email notifications sent based on sendEmail setting

## Security Considerations

- Passwords are hashed using bcrypt before storage
- Email uniqueness validation prevents conflicts
- JWT tokens required for all operations
- Role-based access control (hotel admin only)
- Input validation and sanitization on both frontend and backend

## Testing

To test the functionality:

1. Start the backend server
2. Start the frontend development server
3. Login as a hotel administrator
4. Navigate to Service Providers page
5. Click "Add New Provider"
6. Test both auto-generated and custom credential options

## Future Enhancements

- Bulk service provider import
- Email template customization
- Password strength requirements configuration
- Integration with external authentication providers
- Service provider onboarding workflow automation
