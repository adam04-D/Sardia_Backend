const mongoose = require('mongoose');

// This is a sub-schema for comments, so each work can have its own comments.
const CommentSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
});

// This is the main schema for your literary works.
const WorkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    excerpt: {
        type: String,
        required: true
    },
    // --- THIS IS THE FIX ---
    // The missing field is now added to the schema.
    fullContent: {
        type: String,
        required: true
    },
    // ----------------------
    imageUrl: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [CommentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Text index for search across title, excerpt and fullContent
WorkSchema.index({ title: 'text', excerpt: 'text', fullContent: 'text' });

module.exports = mongoose.model('Work', WorkSchema);