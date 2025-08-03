# Vercel Deployment Guide for Hotel Platform

## Overview
This guide covers deploying the Hotel Service Management Platform with separate frontend and backend deployments on Vercel.

## Prerequisites
1. Vercel account (https://vercel.com)
2. MongoDB Atlas database (for production)
3. Stripe account with API keys
4. Email service (Gmail/SMTP) credentials

## Backend Deployment

### 1. Prepare Your Backend
- Ensure `vercel.json` is in the backend root directory
- Update environment variables in Vercel dashboard

### 2. Deploy Backend to Vercel
```bash
cd backend
npx vercel --prod
```

### 3. Backend Environment Variables
Set these in your Vercel project dashboard (Settings > Environment Variables):

**Database:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `NODE_ENV`: production

**Authentication:**
- `JWT_SECRET`: Strong secret for JWT tokens
- `JWT_REFRESH_SECRET`: Strong secret for refresh tokens
- `JWT_EXPIRE`: 24h
- `JWT_REFRESH_EXPIRE`: 7d

**Email:**
- `EMAIL_HOST`: smtp.gmail.com
- `EMAIL_PORT`: 587
- `EMAIL_USER`: Your email address
- `EMAIL_PASS`: Your email password/app password
- `EMAIL_FROM`: Your from email address

**Stripe:**
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

**CORS & Client:**
- `CLIENT_URL`: Your frontend Vercel URL
- `ALLOWED_ORIGINS`: Your frontend Vercel URL
- `SOCKET_CORS_ORIGIN`: Your frontend Vercel URL

**Platform:**
- `PLATFORM_FEE_PERCENTAGE`: 5
- `DEFAULT_HOTEL_MARKUP`: 20
- `CURRENCY`: USD
- `BCRYPT_SALT_ROUNDS`: 12

### 4. Note Your Backend URL
After deployment, note your backend URL (e.g., https://your-backend-app.vercel.app)

## Frontend Deployment

### 1. Update Frontend Configuration
- Ensure `vercel.json` is in the frontend root directory
- Update API URLs in environment variables

### 2. Deploy Frontend to Vercel
```bash
cd frontend
npx vercel --prod
```

### 3. Frontend Environment Variables
Set these in your Vercel project dashboard:

- `REACT_APP_API_URL`: https://your-backend-app.vercel.app/api
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `REACT_APP_SOCKET_URL`: https://your-backend-app.vercel.app
- `CI`: false
- `GENERATE_SOURCEMAP`: false

## Post-Deployment Steps

### 1. Update CORS Settings
After frontend deployment, update backend environment variables:
- `CLIENT_URL`: https://your-frontend-app.vercel.app
- `ALLOWED_ORIGINS`: https://your-frontend-app.vercel.app
- `SOCKET_CORS_ORIGIN`: https://your-frontend-app.vercel.app

### 2. Test Deployment
1. Visit your frontend URL
2. Test user registration/login
3. Test API connectivity
4. Test payment processing
5. Test real-time features (Socket.io)

### 3. Database Setup
1. Create a super admin user
2. Set up initial hotel data
3. Configure service categories

## Important Notes

### File Uploads
- Vercel has limitations with file storage
- Consider using external storage (AWS S3, Cloudinary) for production
- Update upload configurations accordingly

### Database
- Use MongoDB Atlas for production
- Ensure proper connection string format
- Set up database indexes for performance

### Security
- Use strong JWT secrets
- Enable Stripe webhook security
- Configure proper CORS settings
- Use HTTPS for all communications

### Performance
- Enable compression in backend
- Use environment variables for configuration
- Monitor Vercel function limits

## Troubleshooting

### Common Issues
1. **CORS errors**: Check ALLOWED_ORIGINS environment variable
2. **API connection fails**: Verify REACT_APP_API_URL
3. **Database connection**: Check MongoDB Atlas network access
4. **File uploads fail**: Consider external storage solution

### Environment Variable Updates
After updating environment variables in Vercel:
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add/update variables
4. Redeploy the application

## Monitoring
- Use Vercel Analytics for frontend monitoring
- Implement proper logging in backend
- Monitor database performance
- Set up error tracking (Sentry, etc.)

## Scaling Considerations
- Vercel automatically scales functions
- Monitor function execution time limits
- Consider database connection pooling
- Implement proper caching strategies
