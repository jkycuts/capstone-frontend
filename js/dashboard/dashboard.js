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

// getLoggedUser();
// getDashboardData();

async function getLoggedUser() {
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

// // Function to fetch and display the dashboard data
// async function getDashboardData() {
//     /* Access Dashboard Data API endpoint */
//     const response = await fetch(backendURL + "/api/annual-summary/latest", {
//         headers: {
//             Accept: "application/json",
//             Authorization: "Bearer " + localStorage.getItem("token"),
//         },
//     });

//     // Get response if 200-299 status code
//     if (response.ok) {
//         const json = await response.json();

//         // Update dashboard data
//         document.getElementById("company-name").textContent = json.company_name;
//         document.getElementById("annual-emission").textContent = `${json.annual_emission} TCO₂`;
//         document.getElementById("annual-sequestration").textContent = `${json.annual_sequestration} TCO₂`;
//         document.getElementById("neutrality-variance").textContent = `${json.neutrality_variance} TCO₂`;
//         document.getElementById("ghg-contribution").textContent = `${json.ghg_percentage.toFixed(2)}%`;

//     } 
//     // Get response if 400 or 500 status code
//     else {
//         const json = await response.json();
//         errorNotification(json.message, 10);
//     }
// }
