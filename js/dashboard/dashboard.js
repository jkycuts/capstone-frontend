
import { backendURL, successNotification, errorNotification } from "../utils/utils.js";

const btn_logout = document.getElementById("btn_logout");

btn_logout.onclick = async () => {

    /* Access Logout API endpoint */
    const response = await fetch(backendURL + "/api/logout", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    // Get response if 200-299 status code
    if (response.ok) {
        /* Clear Token */
        localStorage.clear();

        /* Redirect Page */
        window.location.pathname = "/login.html";

    // Get response if 400 or 500 status code
    } else {
        const json = await response.json();

        errorNotification(json.message, 10);
    }
};

getLoggedUser();
 async function getLoggedUser () {

    /* Access User Profile API endpoint */
    const response = await fetch(backendURL + "/api/profile/show", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    // Get response if 200-299 status code
    if (response.ok) {
        const json = await response.json();

        document.getElementById("user_logged").innerHTML = json.firstname + " " + json.lastname;
    } 
    // Get response if 400 or 500 status code
    else {
        const json = await response.json();

        errorNotification(json.message, 10);
    }
}

