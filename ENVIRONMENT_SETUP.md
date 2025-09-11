# Environment Setup Guide

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/chatapp

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## Frontend Environment Variables

Create a `.env` file in the `chatapp/` directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_AUTH_URL=http://localhost:3000/api/auth
```

## Production Environment

For production deployment, update the following variables:

### Backend (.env)
```env
MONGODB_URI=your_production_mongodb_uri
PORT=3000
NODE_ENV=production
JWT_SECRET=your_very_secure_production_jwt_secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_API_AUTH_URL=https://your-backend-domain.com/api/auth
```

## Security Notes

1. **Never commit `.env` files to version control**
2. **Use strong, unique JWT secrets in production**
3. **Use HTTPS in production**
4. **Set `NODE_ENV=production` for production deployments**

## Installation

1. Copy `.env.example` to `.env` in both directories
2. Update the values according to your environment
3. Install dependencies: `npm install` in both directories
4. Start the backend: `npm start` (or `node index.js`)
5. Start the frontend: `npm run dev`

