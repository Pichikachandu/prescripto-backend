# Prescripto Backend

Backend API for the Prescripto application built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB Atlas account
- Cloudinary account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Deployment to Render

1. Push your code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - Name: `prescripto-backend`
   - Region: Choose the closest to your users
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables from your `.env` file
7. Click "Create Web Service"

## API Endpoints

- `GET /` - Health check
- `POST /api/admin/login` - Admin login
- `GET /api/doctors` - Get all doctors
- `POST /api/user/register` - Register new user
- ... (list other important endpoints)

## License

ISC
