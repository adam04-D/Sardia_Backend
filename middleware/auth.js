const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Get token from the request header
    const token = req.header('x-auth-token');

    // 2. Check if no token is provided
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // 3. Verify the token
    try {
        // Use the same secret key you used when creating the token
        const decoded = jwt.verify(token, 'yourSecretJwtKey'); 
        
        // Attach the admin info to the request object for future use
        req.admin = decoded.admin;
        next(); // Token is valid, proceed to the next function (the route handler)
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};