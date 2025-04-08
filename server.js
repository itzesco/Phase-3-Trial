const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs"); // For password hashing
const path = require("path");

// Import the User model from models folder
const User = require("./models/User");
const Session = require("./models/Session"); // For storing sessions
const Lab = require("./models/Lab");
const Reservation = require("./models/Reservation");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json()); // To parse JSON requests
app.use(express.static(path.join(__dirname, "public"))); // Serve static files like HTML, CSS, JS

// MongoDB Connection
const mongoURI =
  "mongodb+srv://admin1:CCAPDEV_admin1@cluster0.vd4se.mongodb.net/lab_reservation?retryWrites=true&w=majority";
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Serve the signup page as the default page when accessing the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "signin.html"));
});

//v12 for session
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const session = await Session.findOne({ sessionToken: token });
    if (!session || session.dateExpired < Date.now()) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }

    const user = await User.findById(session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// POST Route for Sign-Up
app.post("/api/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    idNumber,
    password,
    role,
    status,
  } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username or Email already exists" });
    }
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      idNumber,
      password,
      role,
      status: "Active", // Default status is Active
    });

    // Save the user to the database
    await newUser.save();
    //Edited response after registering #13.1
    const sessionToken = generateSessionToken();
    const expiresIn = 2 * 60 * 60 * 1000; // 2 hours

    const newSession = new Session({
      userId: newUser._id,
      sessionToken,
      dateExpired: Date.now() + expiresIn,
    });

    await newSession.save();

    // Send token whether or not rememberMe is true
    res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      sessionToken,
      role: newUser.role,
      user: { ...newUser, id: newUser._id, password: "" }, // Send user data without password
    });

    // res
    //   .status(201)
    //   .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/signin", async (req, res) => {
  const { username, password, rememberMe } = req.body;

  try {
    // First, check if the user exists
    const user = await User.findOne({ username });

    if (!user) {
      // If the user doesn't exist, return "Invalid credentials"

      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // V13 - CHANGES: Check if the user is blocked
    if (user.status === "Blocked") {
      return res
        .status(403)
        .json({ success: false, message: "Your account is blocked" });
    }

    // Verify the password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // If password doesn't match, return "Invalid credentials"
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Always generate a session
    const sessionToken = generateSessionToken();
    const expiresIn = rememberMe
      ? 21 * 24 * 60 * 60 * 1000 // 3 weeks
      : 2 * 60 * 60 * 1000; // 2 hours

    const newSession = new Session({
      userId: user._id,
      sessionToken,
      dateExpired: Date.now() + expiresIn,
    });

    await newSession.save();

    // Send token whether or not rememberMe is true
    res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      sessionToken,
      role: user.role,
      user: { ...user._doc, id: user._id, password: "" }, // Send user data without password
    });
  } catch (error) {
    console.error("Sign-in error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// v12 Delete user account
app.delete("/api/deleteAccount", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user's reservations
    await Reservation.deleteMany({ reservedBy: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Remove all sessions for this user (logout from all devices)
    await Session.deleteMany({ userId });

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//v12 change password
// Change Password (Protected Route)
app.put("/api/updatePassword", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = req.user;

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect current password" });
    }

    // Update with new password
    user.password = newPassword; // Pre-save hook will hash this
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Generate session token (for "remember me")
const generateSessionToken = () => {
  return require("crypto").randomBytes(64).toString("hex");
};

// ======================= RESERVATION =======================
// Get all labs with availability -- ADDED N UPDATED IN V5
app.get("/api/labs", async (req, res) => {
  try {
    const labs = await Lab.find();
    res.json(
      labs.map(lab => ({
        labName: lab.labName,
        location: lab.location,
        availability: lab.getAvailability(),
        seats: lab.seats, // THIS LINE ADDEDD IN V5
        _id: lab._id, // THIS LINE ADDEDD IN V5
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching availability", error });
  }
});

// Get available seats for a lab on a specific day
app.get("/api/lab/:id/availability", async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: "Lab not found" });
    res.json(lab.getAvailability());
  } catch (error) {
    res.status(500).json({ message: "Error fetching availability", error });
  }
});

/*
// OG - Make a reservation -- UPDATED IN V5
app.post("/api/reservations", async (req, res) => {
  try {
    const { labID, seats, reservedBy, timeSlot, _id, anonymous } = req.body;
    let existingReservation;
    if (_id !== "") {
      existingReservation = await Reservation.findById(_id);
    }

    if (existingReservation !== undefined) {
      try {
        await Reservation.findByIdAndUpdate(
          _id,
          {
            labID,
            seats,
            reservedBy,
            timeSlot,
            anonymous,
          },
          {
            new: true,
          }
        )
          .then(updatedReservation => {
            res.status(201).json({
              message: "Reservation updated",
              reservation: updatedReservation,
            });
          })
          .catch(error => {
            res
              .status(500)
              .json({ message: "Reservation update failed", error });
          });
      } catch (error) {
        res.status(500).json({ message: "Reservation update failed", error });
      }
    } else {
      // Edited v10 add anonymous
      const newReservation = new Reservation({
        labID,
        seats,
        reservedBy,
        anonymous,
        timeSlot,
      });
      await newReservation.save();
      res.status(201).json({
        message: "Reservation successful",
        reservation: newReservation,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Reservation Unsuccessful", error });
  }
});
*/

/* V13 - Reservation Process
   CHANGES: default status of reservation is changed to "pending"
   DESCRIPTION: function that handles when user reserves
*/
// Example code to set seat availability to false after a reservation is made:
// Example code to set seat availability to false after a reservation is made:
app.post("/api/reservations", async (req, res) => {
  try {
    const { labID, seats, reservedBy, timeSlot, _id, anonymous } = req.body;
    let existingReservation;
    if (_id !== "") {
      existingReservation = await Reservation.findById(_id);
    }

    if (existingReservation !== undefined) {
      try {
        await Reservation.findByIdAndUpdate(
          _id,
          {
            labID,
            seats,
            reservedBy,
            timeSlot,
            anonymous,
            status: "pending", // Ensure status is set to pending when updating
          },
          { new: true }
        )
          .then(updatedReservation => {
            res.status(201).json({
              message: "Reservation updated",
              reservation: updatedReservation,
            });
          })
          .catch(error => {
            res
              .status(500)
              .json({ message: "Reservation update failed", error });
          });
      } catch (error) {
        res.status(500).json({ message: "Reservation update failed", error });
      }
    } else {
      // Create new reservation with status "pending"
      const newReservation = new Reservation({
        labID,
        seats,
        reservedBy,
        anonymous,
        timeSlot,
        status: "pending", // Default status is pending
      });
      
      await newReservation.save();

      // Update seat availability to false (reserved) after the reservation is made
      seats.forEach(seat => {
        Lab.updateOne(
          { _id: labID, "seats.seatNumber": seat },
          { $set: { "seats.$.available": false } }
        ).then(() => {
          console.log(`Seat ${seat} marked as reserved.`);
        }).catch(err => {
          console.error("Error updating seat availability:", err);
        });
      });

      res.status(201).json({
        message: "Reservation successful",
        reservation: newReservation,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Reservation Unsuccessful", error });
  }
});





// Edit a reservation
app.put("/api/reservations/:id", async (req, res) => {
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedReservation)
      return res.status(404).json({ message: "Reservation not found" });
    res.json({ message: "Reservation updated", updatedReservation });
  } catch (error) {
    res.status(500).json({ message: "Reservation Update Unsuccessful", error });
  }
});

// Delete a reservation
app.delete("/api/reservations/:id", async (req, res) => {
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(
      req.params.id
    );
    if (!deletedReservation)
      return res.status(404).json({ message: "Reservation not found" });
    res.json({ message: "Reservation deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Reservation Deletion Unsuccessful", error });
  }
});
// ======================= RESERVATION V5 =======================

// ======================= ADMIN SIDE =======================

/* V13 - ADMIN - User Account Management
   DESCRIPTION: gets users from DB
*/
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "firstName lastName username email role status"
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// V2 ADDITTION
// Block / Unblock User
app.patch("/api/admin/users/:id/block", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Toggle block status (assuming `status` field exists)
    user.status = user.status === "Blocked" ? "Active" : "Blocked";
    await user.save();

    res.status(200).json({ success: true, message: `User ${user.status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// V2 ADDITTION
// Delete a User
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* V13 - Admin
   CHANGES: Excludes reservations with the status "completed" from being fetched in the reservation management.
   DESCRIPTION: Fetches all reservations except those with the status "completed".
*/
app.get("/api/admin/reservations", async (req, res) => {
  try {
    // Fetch all reservations without any filtering
    const reservations = await Reservation.find({})
      .populate("reservedBy", "firstName lastName email") // Populate user details
      .populate("labID", "labName"); // Populate lab details

    res.status(200).json(reservations); // Return all reservations
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" }); // Error handling
  }
});

// V2 ADDITTION
// Cancel a Reservation
app.delete("/api/admin/reservations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Reservation.findByIdAndUpdate(id, { canceled: true });
    res.status(200).json({ success: true, message: "Reservation cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* V13 - ADMIN - Reservation Management
   DESCRIPTION: updates the reservation status (when admin chooses to confirm, cancel, or complete)
*/
/* ORIGINAL
app.put("/api/admin/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found" });
    }

    // Only allow status change based on current status
    if (status === "ongoing" && reservation.status === "pending") {
      reservation.status = "ongoing";
    } else if (status === "cancelled" && reservation.status === "pending") {
      reservation.status = "cancelled";
    } else if (status === "successful" && reservation.status === "ongoing") {
      reservation.status = "successful";
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status change" });
    }

    await reservation.save();
    res.status(200).json({ success: true, reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
*/
// V15 new reservation management
app.put("/api/admin/reservations/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
      const reservation = await Reservation.findById(id);
      if (!reservation) {
          return res.status(404).json({ success: false, message: "Reservation not found" });
      }

      // If reservation is canceled, mark the corresponding seat as available
      if (status === "cancelled") {
          // Assuming the reservation has a 'seats' array holding the seat numbers
          await Lab.updateMany(
              { 'seats.seatNumber': { $in: reservation.seats } }, // Find the seats that are reserved
              { $set: { 'seats.$.available': true } } // Set those seats to available again
          );
      }

        // If reservation is completed (successful), mark the corresponding seat as available
    if (status === "successful") {
      await Lab.updateMany(
        { 'seats.seatNumber': { $in: reservation.seats } }, // Find the seats that are reserved
        { $set: { 'seats.$.available': true } } // Set those seats to unavailable
      );
    }

      // Only allow status change based on current status
      if (status === "ongoing" && reservation.status === "pending") {
          reservation.status = "ongoing";
      } else if (status === "cancelled" && reservation.status === "pending") {
          reservation.status = "cancelled";
      } else if (status === "successful" && reservation.status === "ongoing") {
          reservation.status = "successful";
      } else {
          return res.status(400).json({ success: false, message: "Invalid status change" });
      }

      await reservation.save();
      res.status(200).json({ success: true, reservation });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});


//V10 UPDATE EDIT PERSONAL INFORMATION
app.put("/api/user", async (req, res) => {
  const { username, firstName, lastName, email } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      console.log("User not found with username:", username);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;

    await user.save();
    console.log("Updated user:", user);
    res.status(200).json({
      success: true,
      message: "User information updated successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error updating user information:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// v13 #13.1

app.get("/api/user", async (req, res) => {
  const { username } = req.query;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        idNumber: user.idNumber,
        bio: user.profile.bio,
        status: user.status, // Include status field
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//V10 ADDITION EDIT DESCRIPTION
app.put("/api/updateDescription", async (req, res) => {
  const { username, bio } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update the bio field of the user
    user.profile.bio = bio || user.profile.bio; // Ensure we don't overwrite with undefined or empty if no bio is provided

    await user.save();
    res.status(200).json({
      success: true,
      message: "Description updated successfully",
      updatedBio: bio,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
