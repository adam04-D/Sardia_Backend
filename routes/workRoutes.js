const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Work = require('../models/Work');
const auth = require('../middleware/auth');

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => { cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- PUBLIC ROUTES ---
router.get('/', async (req, res) => { /* ... (no changes here) ... */ });
router.get('/:id', async (req, res) => { /* ... (no changes here) ... */ });
router.post('/:id/like', async (req, res) => { /* ... (no changes here) ... */ });
router.post('/:id/comments', async (req, res) => { /* ... (no changes here) ... */ });

// --- PROTECTED ADMIN ROUTES ---

// POST a new literary work
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        if (!req.file) { return res.status(400).json({ message: 'Image file is required.' }); }
        const newWork = new Work({ title, excerpt, fullContent, imageUrl: req.file.path });
        const savedWork = await newWork.save();
        res.status(201).json(savedWork);
    } catch (error) { console.error(error.message); res.status(500).send('Server Error'); }
});

// --- THIS IS THE FIX ---
// UPDATE a literary work (Now handles text-only updates without deleting the image)
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;

        // Create an object with only the fields we want to update.
        const updatedFields = { title, excerpt, fullContent };

        // Use the '$set' operator to only update the specified fields.
        // This prevents Mongoose from deleting the existing imageUrl.
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
// --- END OF FIX ---

// DELETE a literary work
router.delete('/:id', auth, async (req, res) => { /* ... (no changes here) ... */ });

module.exports = router;