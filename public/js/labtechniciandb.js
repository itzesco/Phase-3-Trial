document.addEventListener("DOMContentLoaded", function() {
    const featureBoxes = document.querySelectorAll(".feature-box");
    const dashboard = document.querySelector(".dashboard");
    const dataContainer = document.createElement("div");
    const logoutButton = document.getElementById("logout-button");

    dataContainer.id = "data-container";
    dataContainer.style.marginTop = "20px";
    dataContainer.style.padding = "20px";
    dataContainer.style.background = "#f1f8e9";
    dataContainer.style.borderRadius = "10px";
    dataContainer.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
    dataContainer.style.display = "none"; // Hide initially
    dataContainer.style.color = "#094C2D";
    dashboard.appendChild(dataContainer);

    /*
    let userAccounts = [
        { name: "John Doe", email: "john_doe@dlsu.edu.ph", status: "Active" },
        { name: "Jane Smith", email: "jane_smith@dlsu.edu.ph", status: "Blocked" },
        { name: "Michael Tan", email: "michael_tan@dlsu.edu.ph", status: "Active" },
        { name: "Sarah Lee", email: "sarah_lee@dlsu.edu.ph", status: "Inactive" },
        { name: "David Cruz", email: "david_cruz@dlsu.edu.ph", status: "Active" }
    ];

    let reservations = [
        { seat: "Comp 3", student: "John Doe", email: "john_doe@dlsu.edu.ph", date: "2025-02-10", time: "10:00 AM - 10:30 AM", status: "Reserved" },
        { seat: "Comp 7", student: "Jane Smith", email: "jane_smith@dlsu.edu.ph", date: "2025-02-11", time: "2:30 PM - 3:00 PM", status: "Anonymous" },
        { seat: "Comp 12", student: "Michael Tan", email: "michael_tan@dlsu.edu.ph", date: "2025-03-15", time: "1:00 PM - 1:30 PM", status: "Available" }
    ]; */

    // V2 ADDITIONS
    async function blockUser(userId) {
        await fetch(`/api/admin/users/${userId}/block`, { method: 'PATCH' });
        fetchUsers();  // Refresh user list
    }

    // V2 ADDITIONS    
    async function deleteUser(userId) {
        await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        fetchUsers();  // Refresh user list
    }

    // V2 ADDITIONS
    //  This fetches user accounts from MongoDB
    async function fetchUsers() {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
    
        displayData("User Accounts", users.map(user => `
            <tr>
              <td>${user.firstName} ${user.lastName}</td>
              <td>${user.email}</td>
              <td>${user.role}</td>
              <td>${user.status}</td>
              <td>
                <button class="block-btn" data-userid="${user._id}">${user.status === "Blocked" ? "Unblock" : "Block"}</button>
                <button class="delete-btn" data-userid="${user._id}">Delete</button>
              </td>
            </tr>
          `).join(""), ["Name", "Email", "Role", "Status", "Actions"]);

          // Now attach click listeners AFTER rendering
    document.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-userid');
          if (confirm("Are you sure you want to toggle the block status for this user?")) {
            blockUser(userId);
        }
        });
      });
  
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-userid');
          if (confirm("Are you sure you want to toggle the delete status for this user?")) {
            deleteUser(userId);
        }
        });
      });
    }
    

    
    // V2 ADDITIONS
    // fetches reservations from MONGODB
    async function fetchReservations() {
        const response = await fetch('/api/admin/reservations');
        const reservations = await response.json();
    
        displayData("Current Reservations", reservations.map(res => `
            <tr>
                <td>${res.labID.labName}</td>
                <td>${res.reservedBy.firstName} ${res.reservedBy.lastName}</td>
                <td>${res.timeSlot.date}</td>
                <td>${res.timeSlot.timeStart}</td>
                <td>
                    <button onclick="cancelReservation('${res._id}')">Cancel</button>
                </td>
            </tr>
        `).join(""), ["Lab", "Student", "Date", "Time", "Actions"]);
    }
    
    // V2 ADDITIONS (PENDING)
    async function cancelReservation(reservationId) {
        await fetch(`/api/admin/reservations/${reservationId}`, { method: 'DELETE' });
        fetchReservations();  // Refresh reservation list
    }

    let reservationHistory = [
        { seat: "Comp 1", student: "John Doe", date: "2025-01-10", time: "9:00 AM - 9:30 AM" },
        { seat: "Comp 5", student: "Jane Smith", date: "2025-01-12", time: "11:00 AM - 11:30 AM" },
        { seat: "Comp 9", student: "Michael Tan", date: "2025-01-15", time: "1:00 PM - 1:30 PM" }
    ];

    // V2 ADDITIONS
    featureBoxes[0].addEventListener("click", function() {
        fetchUsers();
    });
    
    // V2 ADDITIONS 
    featureBoxes[1].addEventListener("click", function() {
        fetchReservations();
    }); 
    
    featureBoxes[0].addEventListener("click", function() {
        displayData("User Accounts", userAccounts.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td class="${getStatusClass(user.status)}">${user.status}</td>
            </tr>
        `).join(""), ["Name", "Email", "Status"]);
    });

    featureBoxes[1].addEventListener("click", function() {
        displayData("Current Reservations", reservations.map(res => `
            <tr>
                <td>${res.seat}</td>
                <td>${res.student}</td>
                <td>${res.date}</td>
                <td>${res.time}</td>
                <td class="${getStatusClass(res.status)}">${res.status}</td>
            </tr>
        `).join(""), ["Computer", "Student", "Date", "Time", "Status"]);
    });

    featureBoxes[2].addEventListener("click", function() {
        displayData("Reservation History", reservationHistory.map(hist => `
            <tr>
                <td>${hist.seat}</td>
                <td>${hist.student}</td>
                <td>${hist.date}</td>
                <td>${hist.time}</td>
            </tr>
        `).join(""), ["Computer", "Student", "Date", "Time"]);
    });

    function displayData(title, content, headers) {
        dataContainer.style.display = "block";
        dataContainer.innerHTML = `
            <h2>${title}</h2>
            <table>
                <thead>
                    <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
                </thead>
                <tbody>${content}</tbody>
            </table>
        `;
    }

    function getStatusClass(status) {
        return status === "Available" ? "status-available" : 
               status === "Reserved" ? "status-reserved" : 
               "status-anonymous";
    }
    
    logoutButton.addEventListener("click", function() {
        window.location.href = "signin.html"; 
    });
});
