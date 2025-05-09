import { backendURL, successNotification, errorNotification } from "../utils/utils.js";

// Check if the user is already logged in and redirect to their dashboard
if (localStorage.getItem("token")) {
    const role = localStorage.getItem("role");
    if (role === "super_admin") {
        window.location.href = "/admin.html";  // Redirect to Admin Dashboard
    } else {
        window.location.href = "/index.html";  // Redirect to User Dashboard
    }
}

const form_login = document.getElementById("form_login");

if (form_login) {
    form_login.onsubmit = async (e) => {
        e.preventDefault();

        const loginButton = form_login.querySelector("button");
        loginButton.disabled = true;
        loginButton.innerHTML = `
            <div class="spinner-border me-2" role="status"></div> 
            <span>Loading...</span>`;

        const formData = new FormData(form_login);

        try {
            const response = await fetch(`${backendURL}/api/user/login`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
                body: formData,
            });

            const data = await response.json();
            console.log("Login Response Data:", data); // Add this line

            if (response.ok) {
                // Store user info in localStorage
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                localStorage.setItem("user", JSON.stringify(data.user));


                // Redirect based on role
                if (data.role === "super_admin") {
                    window.location.href = "/admin.html";  // Redirect to Admin Dashboard
                } else {
                    window.location.href = "/index.html";  // Redirect to User Dashboard
                }
            } else {
                errorNotification(data.message || "Login failed", 5);
            }
        } catch (error) {
            console.error("Login Error:", error);
            errorNotification("An error occurred while logging in.", 5);
        }

        // Re-enable the login button
        loginButton.disabled = false;
        loginButton.innerHTML = "Login";
    };
}
