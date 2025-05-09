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


// Render GHG Chart
function renderGHGChart(totalEmission, totalSequestration, carbonVariance, percentageGHG) {
    const ctx = document.getElementById("ghgChart").getContext("2d");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "GHG Emission (TCO₂)",
                "Carbon Sequestration (TCO₂)",
                "Neutrality Variance (TCO₂)",
                "National GHG Contribution (%)"
            ],
            datasets: [{
                label: "GHG Metrics",
                data: [totalEmission, totalSequestration, carbonVariance, percentageGHG],
                backgroundColor: [
                    "rgba(220, 53, 69, 0.6)",    // red
                    "rgba(25, 135, 84, 0.6)",     // green
                    "rgba(255, 193, 7, 0.6)",     // yellow
                    "rgba(13, 110, 253, 0.6)"     // blue
                ],
                borderColor: [
                    "rgba(220, 53, 69, 1)",
                    "rgba(25, 135, 84, 1)",
                    "rgba(255, 193, 7, 1)",
                    "rgba(13, 110, 253, 1)"
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Metrics Summary"
                }
            }
        }
    });
}



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
        console.log("API response:", data);

        if (response.ok) {
            const {
                totalEmission,
                total_sequestration,
                carbon_variance,
                percentage_contribution
            } = data;

            // Update DOM elements
            document.getElementById("totalEmission").textContent = `${totalEmission} TCO₂`;
            document.getElementById("totalSequestration").textContent = `${total_sequestration} TCO₂`;
            document.getElementById("carbonVariance").textContent = `${carbon_variance} TCO₂`;
            document.getElementById("percentageGHG").textContent = `${percentage_contribution}%`;

            // Render GHG Chart
            renderGHGChart(
                totalEmission,
                total_sequestration,
                carbon_variance,
                percentage_contribution
            );
        } else {
            errorNotification(data.message || "Failed to load dashboard summary.", 10);
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

    spinner.style.display = "block";
    errorMessage.style.display = "none";

    try {
        const response = await fetch(`${backendURL}/api/tree-growth`, {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + token,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to fetch tree data");
        }

        // Check if 'data' is an array
        const trees = result.data;
        if (Array.isArray(trees)) {
            treeMarkers = []; // reset existing markers

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

            if (treeMarkers.length > 0) {
                const group = L.featureGroup(treeMarkers);
                map.fitBounds(group.getBounds().pad(0.2));
            }
        } else {
            console.error("Expected an array, but got:", result);
            errorMessage.style.display = "block";
        }

    } catch (error) {
        console.error("Error fetching tree data:", error);
        errorMessage.style.display = "block";
    } finally {
        spinner.style.display = "none";
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
