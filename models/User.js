const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /.+\@dlsu\.edu\.ph$/  // Validate email format
    }, 
    idNumber: { 
        type: String, 
        required: true, 
        match: /^\d{8}$/  // Validate ID format (8 digits)
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['student', 'technician'], 
        default: 'student' 
    },
    profile: {
        profilePic: { 
            type: String, 
            default: ""  // Default empty string for profile pic
        },
        bio: { 
            type: String, 
            default: ""  // Default empty string for bio
        },
    },
    rememberToken: { 
        type: String,  // Token for "remember me" functionality
        default: "" 
    },
    rememberTokenExpiry: { 
        type: Date,  // Expiry date for the "remember me" token
        default: Date.now
    },
    status: { 
        type: String,
        enum: ['Active', 'Blocked'],
        default: 'Active',
    }
});

// Hash the password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
    }
    next();
});

// Create a model for User
const User = mongoose.model('User', userSchema);
module.exports = User;
