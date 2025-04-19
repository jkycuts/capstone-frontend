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






// Fetch Dashboard Data (GHG Emission, Carbon Sequestration, etc.)
async function getDashboardData() {
    const token = localStorage.getItem("token");

    if (!token) {
        errorNotification("No authentication token found!", 10);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/dashboard-summary`, {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + token,
            },
        });

        const data = await response.json(); // ✅ Must come before any use of data

        if (response.ok) {
            console.log("Emission:", data.total_emission);
            console.log("Sequestration:", data.total_sequestration);
            console.log("Variance:", data.carbon_variance);
            console.log("Percentage Contribution:", data.percentage_contribution);

            // Get DOM elements
            const totalEmissionElement = document.getElementById("totalEmission");
            const totalSequestrationElement = document.getElementById("totalSequestration");
            const carbonVarianceElement = document.getElementById("carbonVariance");
            const percentageGHGElement = document.getElementById("percentageGHG");

            // Check if all elements exist before assigning values
            if (totalEmissionElement && totalSequestrationElement && carbonVarianceElement && percentageGHGElement) {
                totalEmissionElement.textContent = `${data.total_emission} TCO₂`;
                totalSequestrationElement.textContent = `${data.total_sequestration} TCO₂`;
                carbonVarianceElement.textContent = `${data.carbon_variance} TCO₂`;
                percentageGHGElement.textContent = `${data.percentage_contribution}%`;

              

                

                successNotification('Dashboard data loaded successfully!', 5);
            } else {
                errorNotification("Dashboard elements not found in HTML.", 10);
            }
        } else {
            errorNotification(data.message || "Failed to load dashboard data.", 10);
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        errorNotification("Error fetching dashboard data.", 10);
    }



}
// Call the function to populate the dashboard data on page load
if (document.body.dataset.page === "dashboard") {
    getDashboardData();
}
