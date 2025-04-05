document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    // Check if the logout button exists on the page
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Clear any user-related data from localStorage or sessionStorage
            localStorage.removeItem('userData');  // If you're storing user info in localStorage
            sessionStorage.removeItem('userData');  // If you're using sessionStorage

            // Optionally, clear any related cookies (if you're using them)
            // document.cookie = "userData=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            // Redirect to the login page after logout
            window.location.href = 'signin.html';  // Redirect to the login page
        });
    }
});
