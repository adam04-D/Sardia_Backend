const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get the token from the request header
    const token = req.header('x-auth-token');

    // 2. Check if no token was provided
    if (!token) {
        // This is a 401 Unauthorized error
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // 3. Verify if the token is valid
    try {
        // This uses the secret key from your environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        
        // Attach the admin's information to the request object
        req.admin = decoded.admin;

        // The token is valid, proceed to the actual route handler
        next(); 
    } catch (err) {
        // If jwt.verify fails, the token is invalid
        res.status(401).json({ message: 'Token is not valid' });
    }
};