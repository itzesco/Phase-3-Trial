
// EXPLANATION: all functions inside this function executes only kapag nagload na yung HTML document
document.addEventListener("DOMContentLoaded", function() {
    const featureBoxes = document.querySelectorAll(".feature-box");
    const dashboard = document.querySelector(".dashboard");
    const dataContainer = document.createElement("div");
    const logoutButton = document.getElementById("logout-button");

    dataContainer.id = "data-container";
    dashboard.appendChild(dataContainer);

    // BLOCKS user (V2 Addition)
    async function blockUser(userId) {
        await fetch(`/api/admin/users/${userId}/block`, { method: 'PATCH' });
        fetchUsers();  // Refresh user list
    }

    // DELETES user (V2 Addition)
    async function deleteUser(userId) {
        await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        fetchUsers();  // Refresh user list
    }


    // ======================= FETCH Functions =======================

    //  V16 - fetches users (v16 update such that students lang makuha)
    async function fetchUsers() {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
    
        // Filter users to only include those with role "student"
        const filteredUsers = users.filter(user => user.role === 'student');
    
        // Makes an HTML table that displays only "student" users
        displayData("User Accounts", filteredUsers.map(user => `
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
    
        // BLOCK button listener
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-userid');
                if (confirm("Are you sure you want to toggle the block status for this user?")) {
                    blockUser(userId);
                }
            });
        });
    
        // DELETE button listener
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.getAttribute('data-userid');
                if (confirm("Are you sure you want to toggle the delete status for this user?")) {
                    deleteUser(userId);
                }
            });
        });
    }
    

    /* V13 - ADMIN - Reservation Management
       DESCRIPTION: Fetches Reservation History
    */
   // Function to fetch reservation data and display the table with filters
   async function fetchReservationManagement() {
    // Show the filters section and the data container
    document.getElementById('reservationManagement-filters-container').style.display = "block";
    document.getElementById('data-container').style.display = "block";

    // Get filter values
    const statusFilter = document.getElementById('reservationManagement-status-filter').value;
    const labFilter = document.getElementById('reservationManagement-lab-filter').value;
    const dateFilter = document.getElementById('reservationManagement-date-filter').value;

    // Construct filter parameters
    const filterParams = {};
    if (statusFilter) filterParams.status = statusFilter;
    if (labFilter) filterParams.labID = labFilter;
    if (dateFilter) filterParams['timeSlot.date'] = dateFilter; // Match the exact date

    try {
        const response = await fetch('/api/admin/reservations');
        const reservations = await response.json();

        // Filter reservations based on selected filters and exclude those with "successful" status by default
        const filteredReservations = reservations.filter(res => {

            // Apply other filters if set
            const matchesStatus = statusFilter ? res.status === statusFilter : true;
            const matchesLab = labFilter ? res.labID.labName === labFilter : true;
            const matchesDate = dateFilter ? new Date(res.timeSlot.date).toISOString().split('T')[0] === dateFilter : true;

            return matchesStatus && matchesLab && matchesDate;
        });

        // Display filtered reservations in the table
        if (filteredReservations.length > 0) {
            displayData("Reservation Management", filteredReservations.map(res => `
                <tr>
                    <td>${res.labID ? res.labID.labName : 'N/A'}</td>
                    <td>${res.reservedBy ? res.reservedBy.firstName + ' ' + res.reservedBy.lastName : 'No student assigned'}</td>
                    <td>${res.seats ? res.seats.map(seat => `Comp ${seat}`).join(', ') : 'No seats assigned'}</td>
                    <td>${new Date(res.timeSlot.date).toLocaleDateString()}</td>
                    <td>${res.timeSlot.timeStart} - ${res.timeSlot.timeEnd}</td>
                    <td class="${getStatusClass(res.status)}">
                        ${res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                    </td>
                    <td>
                        <button class="confirm-btn" data-id="${res._id}" ${res.status === 'pending' ? '' : 'disabled'}>Confirm</button>
                        <button class="cancel-btn" data-id="${res._id}" ${res.status === 'pending' ? '' : 'disabled'}>Cancel</button>
                        <button class="complete-btn" data-id="${res._id}" ${res.status === 'ongoing' ? '' : 'disabled'}>Complete</button>
                    </td>
                </tr>
            `).join(""), ["Lab", "Student", "Seats", "Date", "Time", "Status", "Actions"]);
        } else {
            displayData("Reservation Management", "<tr><td colspan='7'>No reservations found</td></tr>", ["Lab", "Student", "Seats", "Date", "Time", "Status", "Actions"]);
        }

        // Add event listeners for the buttons after the table is rendered
        addButtonListeners();

    } catch (error) {
        console.error('Error fetching reservations:', error);
        alert('Failed to load reservations.');
    }
}

// Function to add event listeners for the buttons (Confirm, Cancel, Complete)
function addButtonListeners() {
    document.querySelectorAll('.confirm-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            updateReservationStatus(reservationId, 'ongoing');
        });
    });


    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const reservationId = this.getAttribute('data-id');
            
            // Update the reservation status to cancelled in the backend
            await updateReservationStatus(reservationId, 'cancelled');
            
            // Fetch the updated reservation details
            const reservation = await fetchReservationById(reservationId);
            const canceledSeats = reservation.seats;
    
            // Get all seat elements in the UI
            const seatElements = document.querySelectorAll('.computer');
    
            // Loop through each seat element and update the availability
            seatElements.forEach(seat => {
                const seatNumber = seat.dataset.seat;
                if (canceledSeats.includes(Number(seatNumber))) {
                    seat.classList.remove('reserved');  // Remove the 'reserved' class
                    seat.classList.add('available');    // Add the 'available' class
                    seat.dataset.id = "";               // Reset the data-id to allow reservation
                }
            });
        });
    });
    

    document.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const reservationId = this.getAttribute('data-id');
            updateReservationStatus(reservationId, 'successful');
        });
    });
}

// Call fetchReservationManagement when the "Reservation Management" button is clicked
// Add event listeners to the filters to trigger table refresh when changed
document.getElementById('reservationManagement-status-filter').addEventListener('change', fetchReservationManagement);
document.getElementById('reservationManagement-lab-filter').addEventListener('change', fetchReservationManagement);
document.getElementById('reservationManagement-date-filter').addEventListener('change', fetchReservationManagement);

    
    /* V15 - ADMIN - Reservation Management
       DESCRIPTION: updates status of reservation sa DB then refreshes table to reflect changes
    */
       async function updateReservationStatus(reservationId, status) {
        try {
            const response = await fetch(`/api/admin/reservations/${reservationId}`, {
                method: 'PUT', // Use PUT to update the reservation
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status }), // Send the new status to update
            });
    
            const updatedReservation = await response.json();
            if (updatedReservation.success) {
                alert(`${status.charAt(0).toUpperCase() + status.slice(1)} successful`);
    
                // If the status is canceled, update seat availability
                if (status === 'cancelled') {
                    const canceledSeats = updatedReservation.reservation.seats;
    
                    // Get all seat elements in the UI
                    const seatElements = document.querySelectorAll('.computer');
    
                    // Loop through each seat element and update availability
                    seatElements.forEach(seat => {
                        const seatNumber = seat.dataset.seat;
                        if (canceledSeats.includes(Number(seatNumber))) {
                            seat.classList.remove('reserved');  // Remove the 'reserved' class
                            seat.classList.add('available');    // Add the 'available' class PENDING REMOVE PALITAN TO .COMPUTER
                            seat.dataset.id = "";               // Reset the data-id to allow reservation
                        }
                    });
                }
    
                fetchReservationManagement(); // Refresh the table with updated data
            }
        } catch (error) {
            console.error('Error updating reservation status:', error);
            alert('Failed to update reservation status.');
        }
    }
    
        
    /* V15 - ADMIN - Reservation History
        DESCRIPTION: fetches reservation history
    */
        async function fetchReservationHistory() {
            // Show the filters section and the data container
            document.getElementById('reservationHistory-filters-container').style.display = "block";
            document.getElementById('data-container').style.display = "block";
        
         
            // Get filter values
            const statusFilter = document.getElementById('reservationHistory-status-filter').value;
            const labFilter = document.getElementById('reservationHistory-lab-filter').value;
            const dateFilter = document.getElementById('reservationHistory-date-filter').value;
        
            // Construct filter parameters
            const filterParams = {};
            if (statusFilter) filterParams.status = statusFilter;
            if (labFilter) filterParams.labID = labFilter;
            if (dateFilter) filterParams['timeSlot.date'] = dateFilter; // Match the exact date
        
            try {
                const response = await fetch('/api/admin/reservations');
                const reservations = await response.json();
        
                // Filter reservations based on selected filters and exclude those with "successful" status by default
                const filteredReservations = reservations.filter(res => {
        
                    // Apply other filters if set
                    const matchesStatus = statusFilter ? res.status === statusFilter : true;
                    const matchesLab = labFilter ? res.labID.labName === labFilter : true;
                    const matchesDate = dateFilter ? new Date(res.timeSlot.date).toISOString().split('T')[0] === dateFilter : true;
        
                    return matchesStatus && matchesLab && matchesDate;
                });
        
                // Display filtered reservations in the table
                if (filteredReservations.length > 0) {
                    displayData("Reservation History", filteredReservations.map(res => `
                        <tr>
                            <td>${res.labID ? res.labID.labName : 'N/A'}</td>
                            <td>${res.reservedBy ? res.reservedBy.firstName + ' ' + res.reservedBy.lastName : 'No student assigned'}</td>
                            <td>${res.seats ? res.seats.map(seat => `Comp ${seat}`).join(', ') : 'No seats assigned'}</td>
                            <td>${new Date(res.timeSlot.date).toLocaleDateString()}</td>
                            <td>${res.timeSlot.timeStart} - ${res.timeSlot.timeEnd}</td>
                            <td class="${getStatusClass(res.status)}">
                                ${res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                            </td>
                        </tr>
                    `).join(""), ["Lab", "Student", "Seats", "Date", "Time", "Status"]);
                } else {
                    displayData("Reservation Management", "<tr><td colspan='7'>No reservations found</td></tr>", ["Lab", "Student", "Seats", "Date", "Time", "Status"]);
                }
        
            } catch (error) {
                console.error('Error fetching reservations:', error);
                alert('Failed to load reservations.');
            }
        }
        // Call fetchReservationManagement when the "Reservation History" button is clicked
        // Add event listeners to the filters to trigger table refresh when changed
        document.getElementById('reservationHistory-status-filter').addEventListener('change', fetchReservationHistory);
        document.getElementById('reservationHistory-lab-filter').addEventListener('change', fetchReservationHistory);
        document.getElementById('reservationHistory-date-filter').addEventListener('change', fetchReservationHistory);



    // V13 - Reset filters and hide the filter container when navigating to a new section ()
function resetFilters() {
    // Reset filter values
    document.getElementById('reservationManagement-status-filter').value = "";
    document.getElementById('reservationManagement-lab-filter').value = "";
    document.getElementById('reservationManagement-date-filter').value = "";

    document.getElementById('reservationHistory-status-filter').value = "";
    document.getElementById('reservationHistory-lab-filter').value = "";
    document.getElementById('reservationHistory-date-filter').value = "";

    // Hide the filters container
    document.getElementById('reservationManagement-filters-container').style.display = "none";
    document.getElementById('reservationHistory-filters-container').style.display = "none";

    // Hide the data container (optional: reset any table data)
    document.getElementById('data-container').style.display = "none";
}

// ======================= BUTTON LISTENERS =======================

    // ADMIN - User Account Management Listener (V13)
    featureBoxes[0].addEventListener("click", function() {
        resetFilters(); // Reset filters when navigating to User Account Management
        fetchUsers();
    });
    
    
    // ADMIN - Reservation Management Listener (V13) 
    featureBoxes[1].addEventListener("click", function() {
        resetFilters(); // Reset filters when navigating to User Account Management
        fetchReservationManagement();
    }); 

    // ADMIN - Reservation History Listener (V13) 
    featureBoxes[2].addEventListener("click", function() {
        resetFilters(); // Reset filters when navigating to User Account Management
        fetchReservationHistory();
    });

    // ADMIN - Book Reservation Listener (V13) 
    featureBoxes[3].addEventListener("click", function() {
        resetFilters(); // Reset filters when navigating to User Account Management
        window.location.href = "homescreen.html"; 
    });

    // ADMIN - Logout Button Listener (V13) 
    logoutButton.addEventListener("click", function() {
        resetFilters(); // Reset filters when navigating to User Account Management
        window.location.href = "signin.html"; 
    });
    
// ======================= ADDITIONALS =======================
    
/* V13 - Admin
   DESCRIPTION: dynamically displays reservation data in a table format, parameters being title nung table, headers/column, rows/data
*/ 
    function displayData(title, content, headers) 
    {
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
    
    /* V13 - Admin
       DESCRIPTION: Function that returns a CSS class based on the reservation's current status. (ex: "pending" returns class "status-pending" )
    */
    function getStatusClass(status) 
    {
        return status === "pending" ? "status-pending" : 
               status === "ongoing" ? "status-ongoing" : 
               status === "cancelled" ? "status-cancelled" : 
               status === "successful" ? "status-successful" :
               "status-anonymous";
    }
    
    
    
    

});
