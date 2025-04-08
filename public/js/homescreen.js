document.addEventListener("DOMContentLoaded", async function () {
  //v12
  const usernameOnly = localStorage.getItem("username");
  if (usernameOnly) {
    try {
      const response = await fetch(`/api/user?username=${usernameOnly}`);
      const data = await response.json();

      if (data.success && data.user?.firstName) {
        document.getElementById(
          "welcomeMessage"
        ).textContent = `Welcome, ${data.user.firstName}!`;
      } else {
        console.warn("User data not found or incomplete.");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }

  let reservations = [];
  let selected = {};
  let labs = [];
  let id = "";
  try {
    const response = await fetch("/api/labs");
    labs = await response.json();
  } catch (error) {
    console.error("Error fetching labs:", error);
  }
  async function getReservations() {
    try {
      const response = await fetch("/api/admin/reservations");
      const RESERVATIONS = await response.json();
      RESERVATIONS.map(reservation => {
        const date = new Date(reservation?.timeSlot?.date).toLocaleDateString(
          "en-US",
          {
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        );
        reservations.push({
          _id: reservation._id,
          roomId: reservation?.labID?._id,
          room: reservation?.labID?.labName,
          date: date,
          time: `${reservation?.timeSlot?.timeStart} - ${reservation?.timeSlot?.timeEnd}`,
          seats: reservation.seats,
          // added v9
          anonymous: reservation.anonymous,
          // added v9
          user:
            reservation?.reservedBy?.lastName +
            ", " +
            reservation?.reservedBy?.firstName,
          email: reservation?.reservedBy?.email,
        });
      });
    } catch (error) {
      console.error("Error fetching labs:", error);
    }
  }
  await getReservations();
  //   const reservations = [
  //     {
  //       room: "Room 201",
  //       date: "February",
  //       day: "10, 2025",
  //       time: "10:00 AM - 10:30 AM",
  //       seat: "Comp 3",
  //       user: "John Doe",
  //       email: "john_doe@dlsu.edu.ph",
  //     },
  //     {
  //       room: "Room 202",
  //       date: "February",
  //       day: "11, 2025",
  //       time: "2:30 PM - 3:00 PM",
  //       seat: "Comp 7",
  //       user: "Jane Smith",
  //       email: "jane_smith@dlsu.edu.ph",
  //     },
  //     {
  //       room: "Room 203",
  //       date: "March",
  //       day: "15, 2025",
  //       time: "1:00 PM - 1:30 PM",
  //       seat: "Comp 12",
  //       user: "Michael Tan",
  //       email: "michael_tan@dlsu.edu.ph",
  //     },
  //     {
  //       room: "Room 204",
  //       date: "April",
  //       day: "20, 2025",
  //       time: "9:30 AM - 10:00 AM",
  //       seat: "Comp 18",
  //       user: "Sarah Lee",
  //       email: "sarah_lee@dlsu.edu.ph",
  //     },
  //     {
  //       room: "Room 205",
  //       date: "May",
  //       day: "5, 2025",
  //       time: "4:00 PM - 4:30 PM",
  //       seat: "Comp 22",
  //       user: "David Cruz",
  //       email: "david_cruz@dlsu.edu.ph",
  //     },
  //   ];
  const dateInput = document.getElementById("dateSelect");
  const today = new Date();
  today.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  today.setDate(today.getDate()); // Set next 7 days
  const next7Days = new Date();

  next7Days.setDate(today.getDate() + 6); // Set next 7 days

  const formatDate = date => date.toISOString().split("T")[0]; // Format YYYY-MM-DD

  dateInput.min = formatDate(today);
  dateInput.max = formatDate(next7Days);

  const roomSelect = document.getElementById("roomSelect");
  const monthSelect = document.getElementById("dateSelect");

  const timeSelect = document.getElementById("timeSelect");
  const computerGrid = document.getElementById("computerGrid");
  const reserveBtn = document.getElementById("reserveBtn");
  const reservationInfo = document.getElementById("reservationInfo");
  const logoutButton = document.getElementById("logout-button");
  const profileButton = document.getElementById("profile-button");
  const aboutButton = document.getElementById("about-button");
  const user = JSON.parse(localStorage.getItem("user"));
  // added v9
  const anonymous = document.getElementById("anonymous");
  let seats = [];
  monthSelect.value = formatDate(today);

  function updateReservationInfo(reserved, details) {
    if (reserved) {
      reservationInfo.innerHTML = `
                <div class="reservation-details">
                    <h3>Not Available</h3>
                    <p><strong>Reserved by:</strong> ${
                      details.anonymous
                        ? details.email === user.email
                          ? "Anonymous YOU"
                          : "Anonymous"
                        : details.user
                    }</p>
                    <p><strong>Email address:</strong>${
                      details.anonymous
                        ? details.email === user.email
                          ? "Anonymous YOU"
                          : "Anonymous"
                        : details.email
                    } </p>
                    <p><strong>Date:</strong> ${details.date}</p>
                    <p><strong>Time:</strong> ${details.time}</p>
                    <button class="notify-btn">Notify Me</button>
                    <p class="notify-text">Get notified when this seat becomes available.</p>
                </div>
            `;
      reservationInfo.style.display = "block";
      reserveBtn.disabled = true;
    } else {
      reservationInfo.innerHTML = "";
      reservationInfo.style.display = "none";
      reserveBtn.disabled = false;
    }
  }

  // Populate room options
  labs.forEach(lab => {
    let option = document.createElement("option");
    option.textContent = `${lab.labName}`;
    option.value = lab._id;
    roomSelect.appendChild(option);
  });
  // Create computer seats dynamically

  // Populate month options
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  //   months.forEach(month => {
  //     let option = document.createElement("option");
  //     option.textContent = month;
  //     monthSelect.appendChild(option);
  //   });

  // Generate time slots
  function generateTimeSlots() {
    const times = [];
    let hour = 8;
    let period = "AM";

    while (!(hour === 6 && period === "PM")) {
      let nextHour = hour === 12 ? 1 : hour + 1;
      let nextPeriod = hour === 11 && period === "AM" ? "PM" : period;

      times.push(`${hour}:00 ${period} - ${hour}:30 ${period}`);
      times.push(`${hour}:30 ${period} - ${nextHour}:00 ${nextPeriod}`);

      if (hour === 11 && period === "AM") {
        period = "PM";
      } else if (hour === 11 && period === "PM") {
        break;
      }

      hour = nextHour;
    }

    timeSelect.innerHTML = "";
    times.forEach(time => {
      let option = document.createElement("option");
      option.textContent = time;
      timeSelect.appendChild(option);
    });
  }

  generateTimeSlots();

  function handleWritter() {
    computerGrid.innerHTML = "";
    document.getElementById("reservationList").innerHTML = "";
    reservations
      .filter(e => e.email === user.email)
      .forEach((reservation, i) => {
        const reservationDate = new Date(reservation.date);
        const today = new Date().setDate(new Date().getDate() - 1);
        const isPast = reservationDate < today;
        //added a class="reservation-text"
        document.getElementById("reservationList").innerHTML += `
          <div class="reservation">
            <div class="reservation-header">
              <h2 class="reservation-text">${reservation.room}</h2>
              ${
                !isPast
                  ? `<img src="images/pencil.png" alt="Edit Icon" class="edit-btn" data-id=${reservation._id}>`
                  : ""
              }
            </div>
              <p class="reservation-text"><strong>Date:</strong> ${reservationDate.toDateString()}</p>
              <p class="reservation-text"><strong>Time:</strong> ${
                reservation.time
              }</p>
              <p class="reservation-text"><strong>Seat:</strong> ${reservation.seats
                .map(seat => `Comp ${seat}`)
                .join(", ")}</p>
              <p class="reservation-text"><strong>Reserved by:</strong> ${
                reservation.anonymous
                  ? reservation.email === user.email
                    ? "Anonymous YOU"
                    : "Anonymous"
                  : reservation.user
              }</p>
              ${
                !isPast &&
                `<div
                    style="display:flex; align-items: end; justify-content:end; "
                  >
                    <button data-id='${reservation._id}' class="cancel-btn" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                      Cancel
                    </button>
                  </div>`
              }
          </div>
        `;
      });
    // edited v9
    // if (document.getElementById("cancel")) {
    //   document.getElementById("cancel").innerHTML = "";
    // }
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        document.getElementById("reservedBtnTxt").innerHTML =
          "Update Reservation";
        reserveBtn.style.backgroundColor = "#FFA500"; // Change to orange color
        const data = btn.getAttribute("data-id");
        const reservation = reservations.find(res => res._id === data);
        selected = reservation;
        roomSelect.value = reservation.roomId;
        const reservationDate = new Date(reservation.date);
        reservationDate.setDate(reservationDate.getDate() + 1);
        monthSelect.value = formatDate(reservationDate);
        timeSelect.value = reservation.time;
        // edited v9
        anonymous.checked = reservation.anonymous;
        id = reservation._id;
        // reservationDate.disabled = true;
        // timeSelect.disabled = true;
        // roomSelect.disabled = true;
        // monthSelect.disabled = true;
        seats = reservation.seats;
        selected = reservation;
        updateSeatColors();
        //   document.getElementById("editModal").style.display = "block";

        // Create cancel button
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel Edit";
        cancelBtn.classList.add("cancel-edit-btn");
        document.getElementById("cancel").appendChild(cancelBtn);

        cancelBtn.addEventListener("click", function () {
          id = "";
          seats = [];
          selected = {};
          updateSeatColors();
          document.getElementById("reservedBtnTxt").innerHTML = "Reserve seat";
          reserveBtn.style.backgroundColor = "#FFFFFF";
          document.getElementById("cancel").innerHTML = "";
        });
      });
    });
  }

  /* ORIG - V15/V16
  function handleLabs() {
    labs?.length &&
      roomSelect.value &&
      labs
        .find(lab => lab._id === roomSelect.value)
        .seats.forEach(({ seatNumber, available }) => { // Iterate over all seats, regardless of availability
          let comp = document.createElement("div");
          comp.classList.add("computer");
          comp.textContent = `Comp ${seatNumber}`;
          comp.dataset.seat = Number(seatNumber);
  
          // If seat is reserved, apply 'reserved' class, else keep it normal
          if (!available) {
            comp.classList.add("reserved"); // Mark the seat as reserved visually
            comp.setAttribute("data-id", `reserved_${seatNumber}`); // You can store a reserved flag or reservation ID
          }
  
          // If the seat is selected for this reservation, mark it as selected
          if (
            seats.includes(Number(seatNumber)) &&
            selected.roomId === roomSelect.value &&
            new Date(selected.date).toDateString() === new Date(monthSelect.value).toDateString() &&
            selected.time === timeSelect.value
          ) {
            comp.classList.add("selected");
          }
  
          // Add click event to handle seat selection/deselection
          comp.addEventListener("click", function () {
            if (this.classList.contains("reserved")) {
              // If the seat is reserved, show details and prevent selection
              const reservationId = this.getAttribute("data-id");
              const reservationDetails = reservations.find(e => e._id === reservationId);
              if (reservationDetails) {
                updateReservationInfo(true, reservationDetails);
              }
              alert("This computer is already reserved.");
              return;
            }
  
            // Toggle seat selection
            if (this.classList.contains("selected")) {
              this.classList.remove("selected");
              seats = seats.filter(seat => Number(seat) !== Number(this.dataset.seat));
            } else {
              this.classList.add("selected");
              seats.push(Number(this.dataset.seat));
            }
  
            // Update the reservation details based on selected seats
            const selectedRoom = roomSelect.value.trim();
            const selectedDate = monthSelect.value.trim();
            const selectedTime = timeSelect.value.trim();
            const selectedSeats = seats;
  
            const reservedDetails = reservations.find(
              res =>
                res.roomId === selectedRoom &&
                new Date(res.date).toDateString() === new Date(selectedDate).toDateString() &&
                res.time === selectedTime &&
                res.seats === selectedSeats &&
                res.email !== user.email
            );
  
            if (reservedDetails) {
              updateReservationInfo(true, reservedDetails);
            } else {
              updateReservationInfo(false);
            }
          });
  
          // Append the seat to the grid
          computerGrid.appendChild(comp);
        });
  }
  ORIG */
  // TESTING
  function handleLabs() {
    if (labs?.length && roomSelect.value) {
        const selectedLab = labs.find(lab => lab._id === roomSelect.value);

        selectedLab?.seats.forEach(({ seatNumber, available }) => {
            let comp = document.createElement("div");
            comp.classList.add("computer");
            comp.textContent = `Comp ${seatNumber}`;
            comp.dataset.seat = seatNumber;

            if (!available) {
                comp.classList.add("reserved");
                comp.setAttribute("data-id", seatNumber); // Use seat number for ID
            }

            comp.addEventListener("click", function () {
                if (this.classList.contains("reserved")) {
                    const seatNumber = this.getAttribute("data-id");
                    const reservationDetails = reservations.find(reservation =>
                        reservation.seats.includes(Number(seatNumber)) &&
                        reservation.reservedBy?.email !== user.email // Ensure it fetches the correct user details
                    );

                    if (reservedDetails && reservedDetails.status !== "cancelled" && reservedDetails.status !== "completed") {
                      // If the seat is reserved, show the reservation details
                        updateReservationInfo(true, reservationDetails);
                    } else {
                      updateReservationInfo(true, reservationDetails);
                    }
                    return;
                } 

                // Handle seat selection/deselection logic for available seats
                if (this.classList.contains("selected")) {
                    this.classList.remove("selected");
                    seats = seats.filter(seat => seat !== Number(this.dataset.seat));
                } else {
                    this.classList.add("selected");
                    seats.push(Number(this.dataset.seat));
                }

                // Update reservation info when seats are selected
                const selectedRoom = roomSelect.value.trim();
                const selectedDate = monthSelect.value.trim();
                const selectedTime = timeSelect.value.trim();
                const selectedSeats = seats;

                const reservedDetails = reservations.find(reservation =>
                    reservation.roomId === selectedRoom &&
                    new Date(reservation.date).toDateString() === new Date(selectedDate).toDateString() &&
                    reservation.time === selectedTime &&
                    reservation.seats.every(seat => selectedSeats.includes(seat))
                );

                // LATEST ADDED, FIXED BUG OF SHOWING RESERVE DEETS OF SEAT KAHIT AVAILABLE NA
                // Check if the reservation exists and its status is not 'cancelled' or 'completed'
                if (reservedDetails && reservedDetails.status !== "cancelled" && reservedDetails.status !== "completed") {
                  updateReservationInfo(true, reservedDetails);  // Display reservation details
                } else {
                  updateReservationInfo(false);  // Show available state (no reservation)
                }
            });

            computerGrid.appendChild(comp);
        });
    }
}


  // Update seat colors based on reservation
  /* original
  function updateSeatColors() {
    const selectedRoom = roomSelect.value.trim();
    const selectedDate = monthSelect.value.trim();
    const selectedTime = timeSelect.value.trim();
    document.querySelectorAll(".computer").forEach(comp => {
      comp.classList.remove("reserved");
    });
    handleWritter();
    handleLabs();
    reservations.forEach(res => {
      if (
        res.roomId === selectedRoom &&
        new Date(res.date).toDateString() ===
          new Date(selectedDate).toDateString() &&
        res.time === selectedTime
      ) {
        res.seats.forEach(seat => {
          const seatElement = [...document.querySelectorAll(".computer")].find(
            comp => {
              return Number(comp.dataset.seat) === Number(seat);
            }
          );
          if (seatElement && selected._id !== res._id) {
            seatElement.classList.add("reserved");
            seatElement.setAttribute("data-id", res._id);
          }
        });
      }
    });
  }
  original */
  function updateSeatColors() {
    const selectedRoom = roomSelect.value.trim();
    const selectedDate = monthSelect.value.trim();
    const selectedTime = timeSelect.value.trim();
    
    // Clear all existing reserved classes
    document.querySelectorAll(".computer").forEach(comp => {
      comp.classList.remove("reserved");
    });
  
    // Re-fetch seat availability to ensure it reflects the latest status
    fetch(`/api/lab/${selectedRoom}/availability`)
      .then(response => response.json())
      .then(seats => {
        // Re-apply the "reserved" class for unavailable seats
        document.querySelectorAll(".computer").forEach(comp => {
          const seatNumber = Number(comp.dataset.seat);
          const seat = seats.find(s => s.seatNumber === seatNumber);
  
          if (seat && seat.available === false) {
            comp.classList.add("reserved");
            comp.setAttribute("data-id", `reserved_${seatNumber}`);
          }
        });
      })
      .catch(error => {
        console.error("Error fetching seat availability:", error);
      });
    
    handleWritter(); // testing
    handleLabs();
  }
  roomSelect.addEventListener("change", updateSeatColors);
  monthSelect.addEventListener("change", updateSeatColors);
  timeSelect.addEventListener("change", updateSeatColors);

  updateSeatColors();

  document.getElementById("confirmationModal").style.display = "none";

  reserveBtn.addEventListener("click", function () {
    document.getElementById("confirmationModal").style.display = "block";

    const selectedRoom = roomSelect.value;
    const selectedDate = monthSelect.value;
    const selectedTime = timeSelect.value;
    const selectedSeat = seats;

    if (selectedSeat.length < 1) {
      alert("Please select a computer before reserving.");
      return;
    }
    let labName = labs.find(lab => lab._id === selectedRoom)?.labName;

    document.getElementById("confirmRoom").textContent = labName;
    document.getElementById("confirmDate").textContent = `${new Date(
      selectedDate
    ).toDateString()}`;
    document.getElementById("confirmTime").textContent = selectedTime;
    document.getElementById("confirmSeat").textContent = selectedSeat.map(
      seat => ` Comp ${seat}`
    );
    document.getElementById("confirmationModal").style.display = "flex";

    document.getElementById("confirmBtn").onclick = async function () {
      seats = [];
      updateSeatColors(); // Refresh seat colors based on updated seat availability
  
      // Change to green color (this part is already in place)
      try {
          await fetch("/api/reservations", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  _id: id,
                  labID: selectedRoom,
                  seats: selectedSeat,
                  reservedBy: user.id,
                  anonymous: anonymous.checked,
                  timeSlot: {
                      date: new Date(`${selectedDate}`).toISOString(),
                      timeStart: selectedTime.split(" - ")[0],
                      timeEnd: selectedTime.split(" - ")[1],
                  },
              }),
          }).then(async () => {
              seats = [];
              selected = {};
              reservations = [];
              await getReservations(); // Re-fetch reservations to update the list
              handleWritter(); // Update the current reservations list
              handleLabs(); // Re-render the lab seats
  
              document.getElementById("reservedBtnTxt").innerHTML = "Reserve Seat";
              reserveBtn.style.backgroundColor = "#ffffff";
          });
      } catch (error) {
          console.error("Error making reservation:", error);
      }
  
      alert(
          `Reservation Successful for ${selectedSeat} on ${selectedDate}  at ${selectedTime}`
      );
      document.getElementById("confirmationModal").style.display = "none";
  
      seats = [];
      selected = {};
  
      // Ensure the seats are updated immediately
      updateSeatColors();
      reserveBtn.disabled = true;
      location.reload();  // This will refresh the page

  };
    document.getElementById("cancelBtn").onclick = function () {
      document.getElementById("confirmationModal").style.display = "none";
    };
  });

  logoutButton.addEventListener("click", function () {
    window.location.href = "signin.html";
  });

  profileButton.addEventListener("click", function () {
    window.location.href = "User Profile.html";
  });

  aboutButton.addEventListener("click", function () {
    window.location.href = "about.html";
  });
  // added v9
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("cancel-btn")) {
      const reservationId = event.target.getAttribute("data-id");
      if (confirm("Are you sure you want to cancel this reservation?")) {
        fetch(`/api/admin/reservations/${reservationId}`, {
          method: "DELETE",
        })
          .then(async () => {
            // reservations = reservations.filter(
            //   res => res._id !== reservationId
            // );
            // console.log(reservations);
            reservations = [];
            await getReservations();
            updateSeatColors();
            alert("Reservation canceled successfully.");
          })
          .catch(error => {
            console.error("Error canceling reservation:", error);
            alert("Failed to cancel reservation. Please try again.");
          });
      }
    }
  });

  //v12
  // 🔍 Search input and popup logic
  const searchInput = document.querySelector(".search-input");
  const userProfilePopup = document.getElementById("userProfilePopup");
  const closeUserPopup = document.getElementById("closeUserPopup");

  searchInput.addEventListener("keypress", async function (e) {
    if (e.key === "Enter") {
      const query = searchInput.value.trim();
      if (!query) return;

      try {
        const res = await fetch(
          `/api/user?username=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (!data.success) {
          alert("User not found.");
          return;
        }

        // Fill profile popup
        document.getElementById(
          "popup-fullname"
        ).textContent = `${data.user.firstName} ${data.user.lastName}`;
        document.getElementById("popup-email").textContent = data.user.email;
        document.getElementById(
          "popup-id"
        ).textContent = `ID Num: ${data.user.idNumber}`;
        document.getElementById("popup-description").textContent =
          data.user.bio || "No bio available.";

        // Fetch and filter reservations
        const res2 = await fetch("/api/admin/reservations");
        const allReservations = await res2.json();
        const filtered = allReservations.filter(
          r => r.reservedBy?.email === data.user.email && !r.anonymous
        );

        const popupReservations = document.getElementById("popup-reservations");
        popupReservations.innerHTML = "";

        if (filtered.length === 0) {
          popupReservations.innerHTML = "<p>No reservations found.</p>";
        } else {
          filtered.forEach(r => {
            popupReservations.innerHTML += `
            <p><strong>Room No.:</strong> ${r.labID.labName}</p>
            <p><strong>Seat No.:</strong> ${r.seats
              .map(seat => `Comp ${seat}`)
              .join(", ")}</p>
            <p><strong>Date:</strong> ${new Date(
              r.timeSlot.date
            ).toDateString()}</p>
            <p><strong>Time:</strong> ${r.timeSlot.timeStart} - ${
              r.timeSlot.timeEnd
            }</p>
            <hr />
          `;
          });
        }

        userProfilePopup.style.display = "flex";
      } catch (error) {
        console.error("Error fetching profile info:", error);
        alert("An error occurred while searching.");
      }
    }
  });

  // Close popup when X is clicked
  closeUserPopup.addEventListener("click", () => {
    userProfilePopup.style.display = "none";
  });
});
