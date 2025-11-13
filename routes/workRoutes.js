const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Work = require('../models/Work');
const auth = require('../middleware/auth');
const fs = require('fs');

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

// GET all literary works with pagination
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch works and only expose approved comments in the public API
        const works = await Work.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
        const total = await Work.countDocuments();

        const sanitized = works.map(w => {
            w.comments = (w.comments || []).filter(c => c.status === 'approved');
            return w;
        });

        res.json({ works: sanitized, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// GET a single literary work by ID


// GET a single literary work by ID
router.get('/:id', async (req, res) => {
    try {
        const work = await Work.findById(req.params.id).lean();
        if (!work) {
            return res.status(404).json({ msg: 'Work not found' });
        }
        // Only return approved comments to public users
        work.comments = (work.comments || []).filter(c => c.status === 'approved');
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
        // New comments are pending moderation by default
        const newComment = { author: req.body.author, text: req.body.text, status: 'pending' };
        work.comments.unshift(newComment);
        await work.save();
        // Return the created comment (will be pending)
        res.status(201).json(work.comments[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// SEARCH endpoint (full-text search)
// GET /api/works/search?q=term&page=1&limit=10
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q.trim()) return res.status(400).json({ message: 'Missing q parameter' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        // Use MongoDB text search and return score-sorted results
        const results = await Work.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Work.countDocuments({ $text: { $search: q } });

        // Only include approved comments
        const sanitized = results.map(w => {
            w.comments = (w.comments || []).filter(c => c.status === 'approved');
            return w;
        });

        res.json({ works: sanitized, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err.message);
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

// UPDATE a literary work (Handles text and optional image replacement)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, fullContent } = req.body;
        const updatedFields = { title, excerpt, fullContent };

        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });

        // Handle image replacement
        if (req.file) {
            // Delete the old image file
            if (work.imageUrl && work.imageUrl !== 'uploads/placeholder.jpg') {
                const oldPath = path.join(__dirname, '..', work.imageUrl);
                fs.unlink(oldPath, (err) => {
                    if (err) console.error(`Failed to delete old image (${oldPath}): ${err.message}`);
                });
            }
            updatedFields.imageUrl = req.file.path;
        }

        const updatedWork = await Work.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        res.json(updatedWork);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE the cover image of a literary work
router.delete('/:id/image', auth, async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });

        // Delete the image file
        if (work.imageUrl && work.imageUrl !== 'uploads/placeholder.jpg') {
            const oldPath = path.join(__dirname, '..', work.imageUrl);
            fs.unlink(oldPath, (err) => {
                if (err) console.error(`Failed to delete image (${oldPath}): ${err.message}`);
            });
        }

        // Remove the imageUrl field
        work.imageUrl = 'uploads/placeholder.jpg';
        await work.save();

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// DELETE a literary work
router.delete('/:id', auth, async (req, res) => {
    try {
        const work = await Work.findById(req.params.id);
        if (!work) return res.status(404).json({ message: 'Work not found' });

        // Delete associated image file if present
        if (work.imageUrl && work.imageUrl !== 'uploads/placeholder.jpg') {
            const oldPath = path.join(__dirname, '..', work.imageUrl);
            fs.unlink(oldPath, (err) => {
                if (err) console.error(`Failed to delete image (${oldPath}): ${err.message}`);
            });
        }

        await Work.findByIdAndDelete(req.params.id);
        res.json({ message: 'Work deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;