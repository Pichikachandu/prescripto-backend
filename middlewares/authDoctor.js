import jwt from 'jsonwebtoken';

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    // Extract token from Authorization header or dToken header
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    let token = '';

    // Check if token is in the format 'Bearer <token>'
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else {
        // Fallback to checking dToken in headers (case-insensitive)
        token = req.headers.dtoken || req.headers.Dtoken || req.headers.DToken || req.headers.dToken || '';
    }

    if (!token) {
        console.error('No token provided in headers');
        return res.status(401).json({ 
            success: false, 
            message: 'Not Authorized: No token provided' 
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded || !decoded.id) {
            console.error('Invalid token payload:', decoded);
            return res.status(401).json({ 
                success: false, 
                message: 'Not Authorized: Invalid token payload' 
            });
        }
        
        // Initialize req.body if it's undefined
        if (!req.body) {
            req.body = {};
        }
        
        // Attach the decoded user ID to the request
        req.user = { id: decoded.id };
        req.body.docId = decoded.id;
        
        console.log('Authenticated doctor ID:', decoded.id);
        next();
    } catch (verifyError) {
        console.error('Token verification failed:', verifyError.message);
        
        let errorMessage = 'Not Authorized: Invalid or expired token';
        if (verifyError.name === 'TokenExpiredError') {
            errorMessage = 'Session expired. Please log in again.';
        } else if (verifyError.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid token';
        }
        
        return res.status(401).json({ 
            success: false, 
            message: errorMessage
        });
    }
};

export default authDoctor;