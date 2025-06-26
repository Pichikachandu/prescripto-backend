// Import required modules
import cors from 'cors';

// List of allowed origins
const allowedOrigins = [
  // Development
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Alternative port
  'http://127.0.0.1:5173', // Localhost alternative
  'http://127.0.0.1:5174', // Localhost alternative
  'http://localhost:3000',  // Common React port
  'http://127.0.0.1:3000', // Common React port alternative
  
  // Production - Vercel frontend URLs
  'https://prescripto-frontend-azure.vercel.app',
  'https://prescripto-frontend.vercel.app',
  'https://prescripto-admin.vercel.app',
  'https://prescripto-admin-git-main-pichikachandu.vercel.app',
  'https://prescripto-frontend-git-main-pichikachandu.vercel.app',
  
  // Add any other domains that need access
];

// CORS options configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      console.log('No origin - allowing (mobile apps, curl, etc.)');
      return callback(null, true);
    }
    
    // Log the origin for debugging
    console.log('Request origin:', origin);
    
    // Check if the origin is in the allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      const isMatch = origin === allowedOrigin || 
                    origin.startsWith('http://localhost:') || 
                    origin.includes('vercel.app') ||
                    origin.includes('netlify.app');
      
      if (isMatch) {
        console.log(`Origin ${origin} is allowed`);
      }
      
      return isMatch;
    });
    
    if (!isAllowed) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      console.error('CORS Error:', msg);
      console.log('Allowed origins:', allowedOrigins);
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'token', 
    'dToken', 
    'x-auth-token',
    'x-requested-with'
  ],
  exposedHeaders: [
    'Content-Range', 
    'X-Content-Range', 
    'token', 
    'dToken',
    'x-auth-token'
  ],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  preflightContinue: false,
  maxAge: 86400, // Cache preflight request for 24 hours
};

// Export the CORS middleware with the configured options
export default cors(corsOptions);
