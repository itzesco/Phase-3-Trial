document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("signup-form").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission
        signUp();
    });
});

async function signUp() {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const idNumber = document.getElementById("id-number").value.trim();
    const password = document.getElementById("password").value.trim();
    const signUpButton = document.getElementById("signup-button");

    // Disable button to prevent multiple clicks
    signUpButton.disabled = true;
    signUpButton.textContent = "Signing Up...";

    // Check for empty fields
    if (!firstName || !lastName || !username || !email || !idNumber || !password) {
        displayError("All fields are required.");
        resetButton();
        return;
    }

    // Validate Email (@dlsu.edu.ph)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@dlsu\.edu\.ph$/;
    if (!emailRegex.test(email)) {
        displayError("Please enter a valid DLSU email address (e.g., student@dlsu.edu.ph).");
        resetButton();
        return;
    }

    // Validate ID Number (8-digit DLSU format)
    const idNumberRegex = /^\d{8}$/;
    if (!idNumberRegex.test(idNumber)) {
        displayError("Please enter a valid 8-digit DLSU ID number.");
        resetButton();
        return;
    }

    // Validate Password (8-16 characters, at least one special character)
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
    if (!passwordRegex.test(password)) {
        displayError("Password must be 8-16 characters long and include at least one special character.");
        resetButton();
        return;
    }

    const userData = {
        firstName,
        lastName,
        username,
        email,
        idNumber,
        password, // Ensure backend hashes it
        role: 'student'
    };

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (data.success) {
            alert('Account created successfully!');
            window.location.href = "signin.html";
        } else {
            displayError(data.message || 'Error creating account');
        }
    } catch (error) {
        displayError('Network error, please try again.');
    }

    resetButton();
}

function displayError(message) {
    const errorContainer = document.getElementById("error-message");
    errorContainer.textContent = message;
    errorContainer.style.display = "block";
}

function resetButton() {
    const signUpButton = document.getElementById("signup-button");
    signUpButton.disabled = false;
    signUpButton.textContent = "Sign Up";
}
