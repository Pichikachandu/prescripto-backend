# Use the official Node.js LTS image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./


# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads && \
    chmod -R 777 uploads

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["npm", "start"]
