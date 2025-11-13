// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const errorHandler = require('./middleware/errorHandler');

// 2. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// 3. Middleware
app.use(cors());
app.use(express.json());
// Serve the 'uploads' folder statically so images can be accessed by the browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply security-related HTTP headers
app.use(helmet());

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// 4. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB!');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

// 5. API Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Sardia API!' });
});

// Use the routes defined in workRoutes.js for any request to /api/works
app.use('/api/works', require('./routes/workRoutes'));
// server.js
app.use('/api/admin', require('./routes/adminRoutes'));

// Refresh token route (example implementation)
app.post('/api/token/refresh', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid refresh token' });

        const accessToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );
        res.json({ accessToken });
    });
});

// Error-handling middleware (should be the last middleware)
app.use(errorHandler);