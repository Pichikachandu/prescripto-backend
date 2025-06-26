#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting deployment script..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Ensure uploads directory exists
echo "📁 Ensuring uploads directory exists..."
mkdir -p uploads

# Set permissions for uploads directory
echo "🔒 Setting permissions for uploads directory..."
chmod -R 777 uploads

# Run database migrations if any
echo "🔄 Running database migrations..."
# Add your migration commands here if needed

echo "✅ Deployment setup completed successfully!"

# Start the server
echo "🚀 Starting server..."
npm start
