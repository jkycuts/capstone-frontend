// Example function to be called after login API succeeds
function handleLoginSuccess(responseData) {
    const { token, role, user } = responseData;

    // Store credentials in localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("user", JSON.stringify(user));

    // Redirect based on role
    if (role === "super_admin") {
        window.location.href = "/admin-dashboard.html";
    } else if (role === "admin") {
        window.location.href = "/admin-dashboard.html"; // Or a different admin-level page
    } else if (role === "user") {
        window.location.href = "/user-dashboard.html";
    } else {
        // Unknown role — log out and redirect
        logout();
    }
}

// Logout function
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/login.html";
}

// Optional: Protect admin page (run this script on every protected admin page)
function protectAdminPage() {
    const role = localStorage.getItem("role");
    if (role !== "super_admin" && role !== "admin") {
        window.location.href = "/unauthorized.html";
    }
}
