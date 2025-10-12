const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission

    const username = usernameInput.value;
    const password = passwordInput.value;
    errorMessage.style.display = 'none'; // Hide previous errors

    try {
        const response = await fetch('https://sardia-backend.onrender.com/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // If the server returns an error (like 400), throw it
            throw new Error(data.message || 'Login failed');
        }

        // --- SUCCESS ---
        // 1. Save the token in the browser's local storage
        localStorage.setItem('authToken', data.token);

        // 2. Redirect the user to the dashboard
        window.location.href = 'dashboard.html';

    } catch (error) {
        // --- FAILURE ---
        // Display the error message from the server
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});