# Hotel Service Management Platform - Backend

## Environment Setup
1. Copy `.env.example` to `.env`
2. Update the environment variables with your actual values
3. Make sure MongoDB is running locally or update MONGODB_URI

## Installation
```bash
npm install
```

## Development
```bash
npm run dev
```

## Production
```bash
npm start
```

## API Documentation
The server will run on http://localhost:5000

### Authentication Routes
- POST /api/auth/login - Login for all user types
- POST /api/auth/register - Register guest users
- POST /api/auth/refresh - Refresh JWT token
- POST /api/auth/logout - Logout user

### Super Admin Routes (/api/superadmin)
- GET /api/superadmin/dashboard - Dashboard data
- GET /api/superadmin/hotels - Get all hotels
- POST /api/superadmin/hotels - Create new hotel
- PUT /api/superadmin/hotels/:id - Update hotel
- DELETE /api/superadmin/hotels/:id - Delete hotel

### Hotel Admin Routes (/api/hotel)
- GET /api/hotel/dashboard - Hotel dashboard data
- GET /api/hotel/service-providers - Get service providers
- POST /api/hotel/service-providers - Create service provider
- GET /api/hotel/markup-settings - Get markup settings
- PUT /api/hotel/markup-settings - Update markup settings

### Service Provider Routes (/api/service)
- GET /api/service/dashboard - Service provider dashboard
- GET /api/service/services - Get services
- POST /api/service/services - Create new service
- PUT /api/service/services/:id - Update service

### Guest Routes (/api/guest)
- GET /api/guest/hotels - Get available hotels
- GET /api/guest/services - Get hotel services
- POST /api/guest/bookings - Create booking
- GET /api/guest/bookings - Get user bookings

## Database Models
- User (Super Admin, Hotel Admin, Service Provider, Guest)
- Hotel
- ServiceProvider
- Service
- Booking
- MarkupSetting
- Payment
