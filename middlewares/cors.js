const allowedOrigins = [
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Alternative port
  'http://127.0.0.1:5173', // Localhost alternative
  'http://127.0.0.1:5174', // Localhost alternative
  'http://localhost:3000',  // Common React port
  'http://127.0.0.1:3000'   // Common React port alternative
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'token', 'dToken'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'token', 'dToken'],
  maxAge: 600 // Cache preflight request for 10 minutes
};

export default corsOptions;
