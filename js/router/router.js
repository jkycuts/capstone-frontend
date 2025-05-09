function setRouter() {
    const role = localStorage.getItem("role");

    switch (window.location.pathname) {
        case "/login.html":
        case "/":
        case "/register.html":
            if (localStorage.getItem("token")) {
                // Redirect to respective pages based on the role
                if (role === "super_admin" || role === "admin") {
                    window.location.href = "/admin.html";  // Admin page
                } else {
                    window.location.href = "/index.html";  // User page
                }
            }
            break;

        case "/admin.html":
            if (role !== "super_admin" && role !== "admin") {
                window.location.href = "/login.html";  // If not admin, redirect to login page
            }
            break;

        case "/index.html":
            if (!localStorage.getItem("token")) {
                window.location.href = "/login.html";  // If no token, redirect to login
            }
            break;

        default:
            break;
    }
}

setRouter();  // Call this function when the page loads


export { setRouter };
