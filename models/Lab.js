/* const mongoose = require('mongoose'); THIS COMMENT IS THE OG VERSION OF LAB.JS

// Lab Schema
const LabSchema = new mongoose.Schema({
    labName: { 
        type: String, 
        required: true  // Name of the lab
    },
    location: { 
        type: String, 
        required: true  // Location of the lab
    },
    capacity: { 
        type: Number, 
        default: 20  // Default capacity is 20
    },
    seats: [{ 
        type: Number,  // Seat numbers 1-20
        required: true
    }]
});

// Initialize 20 seats (1-20) by default if not provided
LabSchema.pre('save', function (next) {
    if (this.seats.length === 0) {
        this.seats = Array.from({ length: this.capacity }, (_, i) => i + 1);  // 1 to 20 seats
    }
    next();
});

module.exports = mongoose.model('Lab', LabSchema); */

const mongoose = require('mongoose');

// Lab Schema
const LabSchema = new mongoose.Schema({
    labName: { 
        type: String, 
        required: true  // Name of the lab
    },
    location: { 
        type: String, 
        required: true  // Location of the lab
    },
    capacity: { 
        type: Number, 
        default: 20  // Default capacity is 20
    },
    seats: [{ 
        seatNumber: Number,
        available: Boolean
    }]
});

// Initialize seats with availability
LabSchema.pre('save', function (next) {
    if (this.seats.length === 0) {
        this.seats = Array.from({ length: this.capacity }, (_, i) => ({
            seatNumber: i + 1,
            available: true
        }));
    }
    next();
});

// Method to check availability for the next 3 days
LabSchema.methods.getAvailability = function () {
    const today = new Date();
    const availability = [];

    for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        availability.push({ date: date.toISOString().split('T')[0], seats: this.seats });
    }
    return availability;
};

module.exports = mongoose.model('Lab', LabSchema);
