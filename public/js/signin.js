document.addEventListener("DOMContentLoaded", function () {document.getElementById("signin-form").addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent default form submission
      signIn();
    });
});

async function signIn() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const signInButton = document.getElementById("signin-button");
  const rememberMe = document.getElementById("remember-me").checked;

  // Disable the sign-in button while making the request
  signInButton.disabled = true;
  signInButton.textContent = "Signing In...";

  // Check for empty fields
  if (!username || !password) {
    displayError("Both username and password are required.");
    resetButton();
    return;
  }

  try {
    // API call to authenticate the user
    const response = await fetch("/api/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, rememberMe }),
    });

    const data = await response.json();

    if (data.success) {
      // Store the username in localStorage for profile updates
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("username", username);

      // Store sessionToken if "Remember Me" is checked
      if (data.sessionToken) {
        localStorage.setItem("sessionToken", data.sessionToken);
      }

      // Redirect based on user role
      if (data.role === "technician") {
        window.location.href = "labtechniciandb.html"; // Redirect if technician
      } else {
        window.location.href = "homescreen.html"; // Redirect if student
      }
    } else {
      displayError("Invalid credentials. Please try again.");
    }
  } catch (error) {
    displayError("Network error, please try again.");
  }

  resetButton();
}

function displayError(message) {
  const errorContainer = document.getElementById("error-message");
  errorContainer.textContent = message;
  errorContainer.style.display = "Blocked";
}

function resetButton() {
  const signInButton = document.getElementById("signin-button");
  signInButton.disabled = false;
  signInButton.textContent = "Sign In";
}

function togglePassword() {
  const passwordField = document.getElementById("password");
  const passwordType = passwordField.type === "password" ? "text" : "password";
  passwordField.type = passwordType;
}
