const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Work = require('../models/Work');
const auth = require('../middleware/auth');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// =================================================================
// --- PUBLIC ROUTES (Accessible to Everyone) ---
// =================================================================

// GET all literary works
router.get('/', async (req, res) => {
    try {
        const works = await Work.find().sort({ createdAt: -1 });
        res.json(works);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// GET a single literary work by ID
router.get('/:id', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) {
            return res.status(404).json({ msg: 'Work not found' });
        }
        res.json(work);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// LIKE a literary work
router.post('/:id/like', async (req, res) => {
    try {
        const work = await Work.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        if (!work) return res.status(404).json({ message: 'Work not found' });
        res.json({ likes: work.likes });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ADD a new comment to a work
router.post('/:id/comments', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });

        const newComment = { author: req.body.author, text: req.body.text };
        work.comments.unshift(newComment);
        await work.save();
        res.status(201).json(work.comments[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// =================================================================
// --- PROTECTED ADMIN ROUTES (Require Login) ---
// =================================================================

// POST a new literary work (handles optional image)
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        const imageUrl = req.file ? req.file.path : 'uploads/placeholder.jpg'; // Use uploaded file or placeholder

        const newWork = new Work({
            title,
            excerpt,
            fullContent,
            imageUrl: imageUrl
        });
        const savedWork = await newWork.save();
        res.status(201).json(savedWork);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// In routes/workRoutes.js

// UPDATE a literary work (Handles text-only updates without deleting image)
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        const updatedFields = { title, excerpt, fullContent };

        // Use the '$set' operator to only update the specified fields.
        // This is the key: it will not touch other fields like 'imageUrl'.
        const updatedWork = await Work.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedWork) return res.status(404).json({ message: 'Work not found' });
        res.json(updatedWork);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a literary work
router.delete('/:id', auth, async (req, res) => {
    try {
        const work = await Work.findByIdAndDelete(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });
        res.json({ message: 'Work deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;