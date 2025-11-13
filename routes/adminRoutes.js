// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Work = require('../models/Work');
const auth = require('../middleware/auth');

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
            process.env.JWT_SECRET, // Replace with a long, random secret key in your .env file
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

// ROUTE: List pending comments across works
// GET /api/admin/works/comments/pending
router.get('/works/comments/pending', auth, async (req, res) => {
    try {
        // Find works that have at least one pending comment and return minimal data
        const works = await Work.find({ 'comments.status': 'pending' }).select('title comments').lean();
        const pending = [];
        works.forEach(w => {
            (w.comments || []).forEach(c => {
                if (c.status === 'pending') pending.push({ workId: w._id, workTitle: w.title, comment: c });
            });
        });
        res.json({ pending });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ROUTE: Approve a comment
// PUT /api/works/:workId/comments/:commentId/approve
router.put('/works/:workId/comments/:commentId/approve', auth, async (req, res) => {
    try {
        const { workId, commentId } = req.params;
        const work = await Work.findById(workId);
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        const comment = work.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.status = 'approved';
        await work.save();
        res.json({ message: 'Comment approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ROUTE: Delete a comment
// DELETE /api/works/:workId/comments/:commentId
router.delete('/works/:workId/comments/:commentId', auth, async (req, res) => {
    try {
        const { workId, commentId } = req.params;
        const work = await Work.findById(workId);
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        const comment = work.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.remove();
        await work.save();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
