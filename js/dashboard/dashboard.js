import { backendURL, successNotification, errorNotification } from "../utils/utils.js";

// Handle Logout
const btn_logout = document.getElementById("btn_logout");
btn_logout.onclick = async () => {
    const response = await fetch(`${backendURL}/api/logout`, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    if (response.ok) {
        localStorage.clear();
        window.location.pathname = "/login.html";
    } else {
        const json = await response.json();
        errorNotification(json.message, 10);
    }
};

// Display Logged-In User
async function getLoggedUser() {
    const response = await fetch(`${backendURL}/api/profile/show`, {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    if (response.ok) {
        const json = await response.json();
        document.getElementById("user_logged").textContent = json.firstname + " " + json.lastname;
    } else {
        const json = await response.json();
        errorNotification(json.message, 10);
    }
}
getLoggedUser();



