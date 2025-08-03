# Authentication Troubleshooting Guide

## Problem: Service Provider Dashboard Auth Errors (401 Unauthorized)

### Symptoms
- React error: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined"
- API requests to `/api/service/categories` returning 401 Unauthorized
- Service provider dashboard not loading properly
- Error in browser console: "Failed to load resource: the server responded with a status of 401 (Unauthorized)"

### Root Cause Analysis

The issue was caused by **inconsistent use of HTTP clients** in the frontend components. Some components were using:
- Raw `axios` imports (which don't include authentication headers)
- Instead of the configured `apiClient` from `api.service.js` (which handles authentication automatically)

### Solution Steps

#### 1. Verify Backend Authentication Works
First, confirm the backend authentication system is functioning:

```bash
# Test with a script like this:
cd backend
node -e "
const axios = require('axios');
axios.post('http://localhost:5000/api/auth/login', {
  email: 'service@example.com',
  password: 'Password123!',
  role: 'service'
}).then(response => {
  const token = response.data.data.token;
  return axios.get('http://localhost:5000/api/service/categories', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  });
}).then(response => {
  console.log('SUCCESS:', response.data);
}).catch(err => {
  console.error('ERROR:', err.response?.data);
});
"
```

#### 2. Identify Components Using Raw Axios

Search for components that import axios directly:
```bash
grep -r "import axios" frontend/src/components/service/
grep -r "from 'axios'" frontend/src/components/service/
```

#### 3. Replace Axios with ApiClient

**WRONG** ❌:
```javascript
import axios from 'axios';

// This doesn't include auth headers
const response = await axios.get('/api/service/categories');
```

**CORRECT** ✅:
```javascript
import apiClient from '../../services/api.service';

// This automatically includes auth headers via interceptors
const response = await apiClient.get('/api/service/categories');
```

#### 4. Fix All Affected Components

The following components were fixed in this case:

1. **CategorySelectionDashboard.js**
```javascript
// BEFORE
import axios from 'axios';
const response = await axios.get(`${API_BASE_URL}/service/categories`);

// AFTER
import apiClient from '../../services/api.service';
const response = await apiClient.get('/api/service/categories');
```

2. **CategoryOrdersManager.js**
3. **ServiceProviderAnalytics.js**
4. **LaundryServiceCreator.js**
5. **TransportationServiceCreator.js**
6. **ToursServiceCreator.js**

### Key Files Modified

#### Frontend Files:
- `frontend/src/components/service/CategorySelectionDashboard.js`
- `frontend/src/components/service/CategoryOrdersManager.js`
- `frontend/src/components/service/ServiceProviderAnalytics.js`
- `frontend/src/components/service/LaundryServiceCreator.js`
- `frontend/src/components/service/TransportationServiceCreator.js`
- `frontend/src/components/service/ToursServiceCreator.js`

#### Backend Files (for testing):
- No temporary test files (cleaned up after debugging)

### How the Authentication System Works

#### 1. Login Flow
```
User Login → Backend generates JWT → Cookie + LocalStorage → Frontend API calls include token
```

#### 2. API Service Interceptors
The `api.service.js` file contains axios interceptors that:
- **Request Interceptor**: Automatically adds `Authorization: Bearer <token>` header
- **Response Interceptor**: Handles 401 errors and redirects to login
- **Token Refresh**: Automatically refreshes expired tokens

#### 3. Token Storage
- **Primary**: HTTP-only cookies (secure)
- **Fallback**: localStorage (for cases where cookies fail)

### Prevention Checklist

To prevent this issue in the future:

- [ ] **Always use `apiClient`** instead of raw `axios` for API calls
- [ ] **Check imports** - look for `import axios from 'axios'` in service components
- [ ] **Use absolute paths** - `/api/endpoint` instead of full URLs
- [ ] **Test authentication** on each component that makes API calls
- [ ] **Add error boundaries** to catch and display authentication errors gracefully

### Quick Debug Commands

#### Check if service provider exists:
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find({ role: 'service' });
  console.log('Service providers:', users.map(u => ({ email: u.email, active: u.isActive })));
  process.exit(0);
});
"
```

#### Reset service provider password:
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const user = await User.findOne({ email: 'your-service@email.com', role: 'service' });
  if (user) {
    user.password = await bcrypt.hash('Password123!', 12);
    await user.save();
    console.log('Password reset successfully');
  }
  process.exit(0);
});
"
```

#### Test frontend login:
```javascript
// In browser console at http://localhost:3000/login
// Fill form with:
// Email: mahmm@gmail.com (or your service provider email)
// Password: Password123!
// Role: service
// Submit and check if redirected to /service/dashboard
```

### Common Pitfalls

1. **Mixed HTTP clients**: Using both `axios` and `apiClient` in the same project
2. **Wrong endpoints**: Using full URLs instead of relative paths
3. **Missing role specification**: Not specifying `role: 'service'` in login requests
4. **Password validation**: Ensure passwords meet backend validation requirements
5. **CORS issues**: Ensure `withCredentials: true` is set for cookie-based auth

### Testing Strategy

Always test authentication in this order:
1. **Backend direct**: Test login and protected routes with curl/scripts
2. **Frontend API service**: Test with apiClient in browser console
3. **Component level**: Test individual components
4. **Integration**: Test full user flow from login to dashboard

### Notes

- The `api.service.js` file is the **single source of truth** for all authenticated API calls
- All service provider components should use this service for consistency
- The authentication system supports multiple storage methods (cookies + localStorage) for reliability
- Error handling is built into the interceptors, so components don't need to handle 401s manually

---

**Last Updated**: July 10, 2025
**Related Issue**: Service Provider Dashboard 401 Authentication Errors
**Status**: ✅ Resolved
