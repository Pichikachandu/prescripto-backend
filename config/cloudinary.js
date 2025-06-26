import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = () => {
    try {
        if (!process.env.CLOUDINARY_NAME || 
            !process.env.CLOUDINARY_API_KEY || 
            !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Missing Cloudinary configuration. Please check your .env file.');
        }

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });

        console.log('Cloudinary connected successfully');
    } catch (error) {
        console.error('Error connecting to Cloudinary:', error.message);
        // Don't throw here to allow the server to start even if Cloudinary fails
        // Individual Cloudinary operations will need to handle their own errors
    }
};

export default connectCloudinary;