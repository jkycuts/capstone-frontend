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

// Fetch Dashboard Summary Data
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

        const data = await response.json();

        if (response.ok) {
            console.log("Emission:", data.total_emission);
            console.log("Sequestration:", data.total_sequestration);
            console.log("Variance:", data.carbon_variance);
            console.log("Percentage Contribution:", data.percentage_contribution);

            // Populate HTML values
            const totalEmissionElement = document.getElementById("totalEmission");
            const totalSequestrationElement = document.getElementById("totalSequestration");
            const carbonVarianceElement = document.getElementById("carbonVariance");
            const percentageGHGElement = document.getElementById("percentageGHG");

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



// Load Tree Locations into the Map
let treeMarkers = []; // declared globally
let map;


async function loadTreeMapMarkers(map) {
    const token = localStorage.getItem("token");

    const spinner = document.getElementById("loading-spinner");
    const errorMessage = document.getElementById("error-message");

    spinner.style.display = "block";      // Show loading spinner
    errorMessage.style.display = "none";  // Hide any existing error

    try {
        const response = await fetch(`${backendURL}/api/tree-growth`, {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + token,
            },
        });

        const result = await response.json();
        const trees = result.data; // Make sure 'trees' is defined properly

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch tree data");
        }

        const treeMarkers = [];

        trees.forEach(tree => {
            if (tree.latitude && tree.longitude) {
                const marker = L.marker([tree.latitude, tree.longitude]).addTo(map)
                    .bindPopup(`
                        <strong>Species:</strong> ${tree.species}<br>
                        <strong>DBH:</strong> ${tree.dbh} cm<br>
                        <strong>Height:</strong> ${tree.height} m<br>
                        <strong>Location:</strong> ${tree.latitude}, ${tree.longitude}
                    `);

                treeMarkers.push(marker);
            }
        });

        // Fit map to show all tree markers
        if (treeMarkers.length > 0) {
            const group = L.featureGroup(treeMarkers);
            map.fitBounds(group.getBounds().pad(0.2));
        }

    } catch (error) {
        console.error("Error fetching tree data:", error);
        errorMessage.style.display = "block";
    } finally {
        spinner.style.display = "none"; // Hide spinner no matter what
    }
}


function initializeTreeMap() {
    map = L.map('map').setView([8.947340, 125.534190], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    loadTreeMapMarkers(map);
}





// On Dashboard Page Load
if (document.body.dataset.page === "dashboard") {
    getDashboardData();
    initializeTreeMap();
}
