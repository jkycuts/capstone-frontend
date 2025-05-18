import { backendURL, successNotification, errorNotification } from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
    const btn_logout = document.getElementById("btn_logout");
    if (btn_logout) {
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
    }
});


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

// Render Carbon Status Signal
function renderStatusSignal(totalEmissions, totalSequestration) {
    const icon = document.getElementById("carbon-status-icon");
    const text = document.getElementById("carbon-status-text");
    const container = document.getElementById("carbon-status");

    if (!icon || !text || !container) return;

    let status = "";
    let iconColor = "";
    let containerBg = "";
    let textColor = "";

    if (totalSequestration > totalEmissions) {
        status = "Carbon Positive";
        iconColor = "bg-green-500";
        containerBg = "bg-green-50 border-green-300";
        textColor = "text-green-700";
    } else if (totalSequestration === totalEmissions) {
        status = "Carbon Neutral";
        iconColor = "bg-gray-500";
        containerBg = "bg-gray-50 border-gray-300";
        textColor = "text-gray-700";
    } else {
        status = "Carbon Negative";
        iconColor = "bg-red-500";
        containerBg = "bg-red-50 border-red-300";
        textColor = "text-red-700";
    }

    // Apply styles
    icon.className = `w-5 h-5 rounded-full ring-2 ring-white animate-pulse shadow-md ${iconColor}`;
    container.className = `status-signal p-4 rounded-xl mb-6 flex items-center space-x-4 shadow-md border ${containerBg}`;
    text.className = `text-lg font-semibold ${textColor}`;
    text.textContent = status;
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

            document.getElementById("totalEmission").textContent = `${totalEmission} TCO₂`;
            document.getElementById("totalSequestration").textContent = `${total_sequestration} TCO₂`;
            document.getElementById("carbonVariance").textContent = `${carbon_variance} TCO₂`;
            document.getElementById("percentageGHG").textContent = `${percentage_contribution}%`;

            renderGHGChart(
                totalEmission,
                total_sequestration,
                carbon_variance,
                percentage_contribution
            );

            renderStatusSignal(totalEmission, total_sequestration);
        } else {
            errorNotification(data.message || "Failed to load dashboard summary.", 10);
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        errorNotification("Error fetching dashboard data.", 10);
    }
}

// Load Tree Locations into the Map
let treeMarkers = [];
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

        const trees = result.data;
        if (Array.isArray(trees)) {
            treeMarkers = [];

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
  const mapContainer = document.getElementById("treeMap");

  if (!mapContainer) {
    console.warn("Map container #treeMap not found. Skipping map initialization.");
    return;
  }

  const map = L.map("treeMap").setView([9.0, 125.5], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  loadTreeMapMarkers(map); // ✅ Corrected
}





// On Dashboard Page Load
if (document.body.dataset.page === "dashboard") {
    getDashboardData();
    initializeTreeMap();
    
}
