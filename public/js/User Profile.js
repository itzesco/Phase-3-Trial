//v12
document.addEventListener("DOMContentLoaded", async function () {

  const popups = document.querySelectorAll(".popup");
  const editButtons = document.querySelectorAll(".edit-btn");
  const closeButtons = document.querySelectorAll(".close-popup");
  const cancelButtons = document.querySelectorAll(".cancel-btn");
  const backButton = document.getElementById("back-button");
  const username = localStorage.getItem("username"); // Get logged-in user

  //v13 start reservation
  if (!username) {
      window.location.href = "signin.html"; // Redirect if not logged in
      return;
  }
  try {
      // Fetch user details
      const response = await fetch(`/api/user?username=${username}`);
      const data = await response.json();

      if (data.success) {
          document.getElementById("user-name").textContent = `${data.user.firstName} ${data.user.lastName}`;
          document.getElementById("user-email").textContent = data.user.email;
          document.getElementById("user-email").href = `mailto:${data.user.email}`;
          document.getElementById("user-id-number").textContent = `ID Num: ${data.user.idNumber}`;
          document.getElementById("first-name").textContent = data.user.firstName;
          document.getElementById("last-name").textContent = data.user.lastName;
          document.getElementById("email").textContent = data.user.email;
          document.getElementById("id-number").textContent = data.user.idNumber;
          document.getElementById("user-bio").textContent = data.user.bio || "No bio available.";
      } else {
          console.error("Failed to load user data:", data.message);
      }
      // Fetch reservations data
      const reservationsResponse = await fetch(`/api/user/reservations`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("sessionToken")}`,
          },
      });
      
      const reservationsData = await reservationsResponse.json();

      if (reservationsData.reservations) {
          const reservationsContainer = document.getElementById("reservations-container");
          reservationsContainer.innerHTML = ""; // Clear previous content

          reservationsData.reservations.forEach(reservation => {
              // Create reservation box dynamically
              const reservationBox = document.createElement("div");
              reservationBox.classList.add("box");
              
              const header = document.createElement("div");
              header.classList.add("header");
              
              const reservationDetails = document.createElement("div");
              reservationDetails.classList.add("reservation-box");
              reservationDetails.innerHTML = `
                  <p class="h1-text">${reservation.labID.labName}</p>
                  <p>Seats: ${reservation.seats.join(", ")}</p>
                  <p>Date: ${new Date(reservation.timeSlot.date).toLocaleDateString()}</p>
                  <p>Time: ${reservation.timeSlot.timeStart} - ${reservation.timeSlot.timeEnd}</p>
                  <p>Status: ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}</p>
              `;

              // Append the reservation box
              reservationBox.appendChild(header);
              reservationBox.appendChild(reservationDetails);
              reservationsContainer.appendChild(reservationBox);
          });
      } else {
          console.log("No reservations found.");
      }
  } catch (error) {
      console.error("Error fetching user data:", error);
  }//v13 end for reservation 

  editButtons.forEach(button => {
      button.addEventListener("click", function () {
          const popupId = this.getAttribute("data-popup");
          document.getElementById(popupId).style.display = "flex";  
      });
  });

  closeButtons.forEach(button => {
      button.addEventListener("click", function () {
          button.closest(".popup").style.display = "none"; 
      });
  });

  cancelButtons.forEach(button => {
      button.addEventListener("click", function () {
          button.closest(".popup").style.display = "none";  
      });
  });

  window.addEventListener("click", function (event) {
      if (event.target.classList.contains("popup")) {
          event.target.style.display = "none";
      }
  });

  backButton.addEventListener("click", function () {
      window.location.href = "homescreen.html";
  });
  //v13
  const deleteAccountBtn = document.getElementById("deleteAccountBtn"); // Button that opens the popup
  const deletePopup = document.getElementById("delete-popup"); // Popup element
  const cancelDeleteBtn = document.querySelector(".cancel-btn"); // Cancel button in the popup
  const confirmDeleteBtn = document.querySelector(".popup-content .delete-btn"); // Confirm delete button inside the popup-content
//v13
  // Show the delete popup when the delete button is clicked
  deleteAccountBtn.addEventListener("click", function () {
      deletePopup.style.display = "flex"; // Show the delete popup
  });
//v13
  // Close the popup when clicking the cancel button
  cancelDeleteBtn.addEventListener("click", function () {
      deletePopup.style.display = "none"; // Hide the delete popup
  });
//v13
  // Handle the confirm delete action (inside the popup-content)
  confirmDeleteBtn.addEventListener("click", async function () {
      const sessionToken = localStorage.getItem("sessionToken"); // Get the session token
  //v13    
      // Check if sessionToken exists
      if (!sessionToken) {
          alert("Session expired. Please log in again.");
          return;
      }

      try {
          // Send DELETE request to the server
          const response = await fetch("/api/deleteAccount", {
              method: "DELETE",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${sessionToken}`,
              },
          });

          const data = await response.json();

          if (response.ok) {
              alert(data.message); // Account deleted successfully
              window.location.href = "signin.html"; // Redirect after account deletion
          } else {
              alert("Failed to delete account: " + data.message); // Error
          }
      } catch (error) {
          console.error("Error deleting account:", error);
          alert("Error occurred while deleting your account. Please try again.");
      }
  });

  const passwordButton = document.querySelector(".change-btn[data-popup='editPasswordPopup']");
  const passwordPopup = document.getElementById("editPasswordPopup");
  const closePasswordPopup = passwordPopup.querySelector(".close-popup");
  const cancelPasswordBtn = passwordPopup.querySelector(".cancel-btn");

  // Show the password change popup
  passwordButton.addEventListener("click", function () {
      passwordPopup.style.display = "flex";
      document.getElementById("current-password").value = "";
      document.getElementById("new-password").value = "";
      document.getElementById("retype-password").value = "";
  });

  // Close the popup when the close button is clicked
  closePasswordPopup.addEventListener("click", function () {
      passwordPopup.style.display = "none";
  });

  // Close the popup when the cancel button is clicked
  cancelPasswordBtn.addEventListener("click", function () {
      passwordPopup.style.display = "none";
  });

 document.querySelector("#editPasswordPopup .save-btn").addEventListener("click", async function () {
    const currentPassword = document.getElementById("current-password").value.trim();  // Trim spaces
    const newPassword = document.getElementById("new-password").value.trim();  // Trim spaces
    const retypePassword = document.getElementById("retype-password").value.trim();  // Trim spaces
    const sessionToken = localStorage.getItem("sessionToken");

    // Validate if all fields are filled
    if (!currentPassword || !newPassword || !retypePassword) {
        alert("Please fill out all fields.");
        return;
    }

    // Check if the new passwords match
    if (newPassword !== retypePassword) {
        alert("New passwords do not match.");
        return;
    }

    // Check password regex for the new password
    const passwordRegex = /^.*(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[$@%_]).{6,}.*$/;

    // Log the password for debugging
    console.log("New password:", newPassword);

    if (!passwordRegex.test(newPassword)) {
        alert("Password must be at least 6 characters and include letters, numbers, and special characters ($@%_).");
        return;
    }

    try {
        const response = await fetch("/api/updatePassword", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password updated successfully!");
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("retype-password").value = "";
            passwordPopup.style.display = "none";  // Close the popup
        } else {
            alert("Failed to update password: " + data.message);
        }
    } catch (error) {
        console.error("Error changing password:", error);
        alert("Something went wrong. Please try again.");
    }
});

  const editProfileButton = document.querySelector(".edit-icon[data-popup='editProfilePopup']");
  const editDescriptionButton = document.querySelector(".edit-icon[data-popup='editDescriptionPopup']");

  const editProfilePopup = document.getElementById("editProfilePopup");
  const editDescriptionPopup = document.getElementById("editDescriptionPopup");

  const cancelEditProfileBtn = editProfilePopup.querySelector(".cancel-btn");
  const cancelEditDescriptionBtn = editDescriptionPopup.querySelector(".cancel-btn");

  // Show Edit Personal Information popup
  editProfileButton.addEventListener("click", function () {
      editProfilePopup.style.display = "flex";
  });

  // Show Edit Description popup
  editDescriptionButton.addEventListener("click", function () {
      editDescriptionPopup.style.display = "flex";
  });

  // Close the Edit Personal Information popup when cancel button is clicked
  cancelEditProfileBtn.addEventListener("click", function () {
      editProfilePopup.style.display = "none";
  });

  // Close the Edit Description popup when cancel button is clicked
  cancelEditDescriptionBtn.addEventListener("click", function () {
      editDescriptionPopup.style.display = "none";
  });

  // V10 UPDATE EDIT PERSONAL INFORMATION
  document.getElementById("editProfilePopup").querySelector(".save-btn").addEventListener("click", async function () {
      const firstName = document.getElementById("edit-first-name").value;
      const lastName = document.getElementById("edit-last-name").value;
      const email = document.getElementById("edit-email").value;

      const username = localStorage.getItem("username");

      const updatedData = {
          username,
          firstName,
          lastName,
          email
      };

      try {
          const response = await fetch('/api/user', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedData)
          });
          const data = await response.json();
          if (data.success) {
              alert("Personal information updated successfully!");
              document.getElementById("first-name").textContent = firstName;
              document.getElementById("last-name").textContent = lastName;
              document.getElementById("email").textContent = email;
              document.getElementById("editProfilePopup").style.display = "none";
              
          } else {
              alert("Failed to update personal information. Error: " + data.message);
          }
      } catch (error) {
          console.error("Error updating personal information:", error);
          alert("Failed to update personal information due to a network error.");
      }
  });

  // V10 ADDITION EDIT DESCRIPTION
  document.getElementById("editDescriptionPopup").querySelector(".save-btn").addEventListener("click", async function () {
      const description = document.getElementById("edit-description").value;
      const username = localStorage.getItem("username");

      try {
          const response = await fetch('/api/updateDescription', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, bio: description })
          });

          const data = await response.json();
          if (data.success) {
              alert("Description updated successfully!");
              document.getElementById("user-bio").textContent = description;
              document.getElementById("editDescriptionPopup").style.display = "none";
          } else {
              alert("Failed to update description. Error: " + data.message);
          }
      } catch (error) {
          console.error("Error updating description:", error);
          alert("Failed to update description due to a network error.");
      }
  });
// v13 end - Profile Picture Update Logic
});

