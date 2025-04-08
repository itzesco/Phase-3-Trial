# 💻 Lab Reservation System

A web-based Computer Laboratory Slot Reservation System designed for De La Salle University students and lab technicians. This web application allows seamless seat reservations, schedule management, and real-time updates for 5 computer labs.

---

## Setting Up and Running the Project
Follow these steps to run the project locally:

Step 1: Open the project folder in Visual Studio Code (VS Code).
Step 2: Open a new terminal window inside VS Code.
Steo 3: Run "npm i"
Step 4: (Optional) If prompted or additional packages are needed, manually install them as required.
Step 5: Run "npm start"
Step 6: Once the server is running, open the local development URL provided in the terminal (e.g., http://localhost:3000 or a similar https:// link). This link appears next to the message like:
“Server running on...”


Default user credentials can be found in user_credentials.txt. Please refer to it for test accounts.

## 📌 Features

### 🪑 View Slot Availability
- Users can select a lab and check available seats in real time.
- View lab availability up to 7 days in advance.
- View reservation holder profiles (if not set to anonymous).

### 📝 Register & Login
- Registration via DLSU email with password protection.
- Two user roles:
  - **Student**: Can reserve lab slots.
  - **Lab Technician**: Can block slots and manage reservations.
- "Remember Me" feature extends login session for 3 weeks with each visit.

### 🔐 Session Management
- Secure login/logout.
- Logging out clears sessions and ends the "remember" period early.

### 📅 Slot Reservation
- Students can reserve available lab slots (in 30-minute intervals).
- Option to reserve anonymously.
- Multiple slots can be reserved in a single transaction.
- Prevents double-booking.

### 👨‍🔧 Technician Tools
- Reserve slots on behalf of walk-in students.
- Remove reservations if the student is absent for 10 minutes past their reserved time.
- Edit or cancel any reservation.

### 👤 User Profile
- Users can:
  - View and edit their profile (name, image, description).
  - Check current reservations.
- Public profile view available for other users (view-only).

### ❌ Account & Reservation Management
- Students can delete their account, removing all associated reservations.
- Edit or cancel own reservations.

### 🔍 Search & View
- Search and view users through reservations section
- View free slots by date, time, and lab.

---

## 🛠️ Technologies Used

- **Frontend**: [HTML/CSS/JS]
- **Backend**: [Node.js]
- **Database**: [MongoDB]
- **Authentication**: Session-based login system with "remember me" token.
- **Deployment**: [Render]

---

## TEAM MEMBERS
Luis Manansala
Princess Escobar
Devie Diamola
Kyle Tan
