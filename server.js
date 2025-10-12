// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 2. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5001;

// 3. Middleware
app.use(cors());
app.use(express.json());
// Serve the 'uploads' folder statically so images can be accessed by the browser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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