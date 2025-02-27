const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('https://api.progs4u.com:3000');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.redirect('https://api.progs4u.com:3000');
        }
        console.log('Decoded token:', user);
        req.user = user;
        next();
    });
}

module.exports = { authMiddleware };

/**
 * Authentication Middleware
 * 
 * Purpose:
 * - Validates JWT tokens for protected routes
 * - Manages user sessions
 * - Handles authentication redirects
 * 
 * Flow:
 * 1. Extracts token from cookies
 * 2. Verifies JWT signature
 * 3. Attaches user object to request
 * 4. Handles unauthorized access
 */
