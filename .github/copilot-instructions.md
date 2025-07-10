# Copilot Instructions for Hotel Service Management Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive B2B2C Hotel Service Management Platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Key Architecture Principles
- **Role-Based Access Control**: 4 distinct user roles with hierarchical permissions (Super Admin, Hotel Admin, Service Provider, Guest)
- **Route Protection**: Each role has dedicated route prefixes and protected access
- **Markup Pricing System**: Dynamic pricing where hotels set markup percentages on service provider base prices
- **Multi-tenant Architecture**: Platform supports multiple hotels with isolated data

## Technology Stack
- **Backend**: Node.js with Express.js, MongoDB with Mongoose, JWT authentication
- **Frontend**: React.js with Redux for state management, React Router for routing
- **Real-time**: Socket.io for live updates and notifications
- **Payment**: Stripe integration for secure payment processing
- **File Upload**: Multer for handling images and documents
- **Email**: NodeMailer for automated notifications

## Critical Routing Structure
- `/` - Guest/Client routes (hotel selection, service booking)
- `/superadmin/*` - Super Admin dashboard and management
- `/hotel/*` - Hotel Admin dashboard and markup management
- `/service/*` - Service Provider dashboard and service management

## Key Business Logic
- **Markup System**: Final Price = Base Price + (Base Price × Markup Percentage)
- **Payment Flow**: Guest pays final price → Hotel receives markup → Provider receives base price
- **Service Categories**: Laundry, Transportation (Car Rental/Taxi), Travel & Tourism

## Code Style Guidelines
- Use functional components with React Hooks
- Implement proper error handling and validation
- Follow REST API conventions for backend endpoints
- Use async/await for asynchronous operations
- Implement comprehensive input validation and sanitization
- Use TypeScript-like JSDoc comments for better code documentation
