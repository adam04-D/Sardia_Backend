const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Work = require('../models/Work');
const auth = require('../middleware/auth'); // Security middleware

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

// ROUTE 1: GET all literary works for the main page
router.get('/', async (req, res) => {
    try {
        const works = await Work.find().sort({ createdAt: -1 });
        res.json(works);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE 2: GET a single literary work by ID for the detail page
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

// ROUTE 3: LIKE a literary work
router.post('/:id/like', async (req, res) => {
    try {
        const work = await Work.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!work) return res.status(404).json({ message: 'Work not found' });
        res.json({ likes: work.likes });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE 4: ADD a new comment to a work
router.post('/:id/comments', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });

        const newComment = {
            author: req.body.author,
            text: req.body.text
        };
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

// ROUTE 5: POST a new literary work
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'Image file is required.' });
        }
        const newWork = new Work({
            title,
            excerpt,
            fullContent: fullContent || "Full content goes here.",
            imageUrl: req.file.path
        });
        const savedWork = await newWork.save();
        res.status(201).json(savedWork);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE 6: UPDATE a literary work
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        const updatedWork = await Work.findByIdAndUpdate(
            req.params.id,
            { title, excerpt, fullContent },
            { new: true }
        );
        if (!updatedWork) return res.status(404).json({ message: 'Work not found' });
        res.json(updatedWork);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ROUTE 7: DELETE a literary work
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