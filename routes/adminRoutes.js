// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ROUTE 1: Register an Admin (run once to create your user)
// POST /api/admin/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if admin already exists
        let admin = await Admin.findOne({ username });
        if (admin) {
            return res.status(400).json({ message: 'Admin user already exists' });
        }
        // Create new admin
        admin = new Admin({ username, password });
        await admin.save();
        res.status(201).send('Admin user created successfully');
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// ROUTE 2: Login an Admin
// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create and return a JSON Web Token (JWT)
        const payload = { admin: { id: admin.id } };
        jwt.sign(
            payload,
            'yourSecretJwtKey', // Replace with a long, random secret key in your .env file
            { expiresIn: '8h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (error) {
        res.status(500).send('Server error');
    }
});

module.exports = router;