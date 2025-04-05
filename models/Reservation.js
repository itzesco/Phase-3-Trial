/* const mongoose = require('mongoose'); THIS COMMENT IS THE OG VERSION OF RESERVATION.JS

// Reservation Schema
const ReservationSchema = new mongoose.Schema({
    labID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lab', 
        required: true 
    },
    seatNum: { 
        type: Number, 
        required: true 
    },
    reservedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    anonymous: { 
        type: Boolean, 
        default: false  // false means it's not anonymous
    },
    timeSlot: {
        date: { 
            type: Date, 
            required: true 
        },
        timeStart: { 
            type: String,  // Format: "9:00 AM - 9:30 AM"
            required: true
        },
    },
    dateReserved: { 
        type: Date, 
        default: Date.now  // Automatically set the date when reservation is made
    },
});

module.exports = mongoose.model('Reservation', ReservationSchema); */

const mongoose = require("mongoose");

// Reservation Schema

const ReservationSchema = new mongoose.Schema({
  labID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab",
    required: true,
  },
  seats: [
    {
      type: Number,
      required: true,
    },
  ],
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // added
  anonymous: {
    type: Boolean,
    default: false, // false means it's not anonymous
  },
  // added
  canceled: {
    type: Boolean,
    default: false, // false means it's not canceled
  },
  timeSlot: {
    date: {
      type: Date,
      required: true,
    },
    timeStart: {
      type: String, // Format: "HH:MM"
      required: true,
    },
    timeEnd: {
      type: String, // Format: "HH:MM"
      required: true,
    },
  },
  dateReserved: {
    type: Date,
    default: Date.now, // Automatically set the date when reservation is made
  },
});

module.exports = mongoose.model("Reservation", ReservationSchema);
