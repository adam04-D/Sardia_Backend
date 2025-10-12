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
    imageUrl: {
        type: String,
        required: true // We will store the path to the uploaded image here
    },
    likes: {
        type: Number,
        default: 0
    },
    // Comments will be an array of objects that follow the CommentSchema blueprint
    comments: [CommentSchema], 
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Work', WorkSchema);