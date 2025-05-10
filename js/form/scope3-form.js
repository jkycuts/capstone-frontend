import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
    const formScope3Travel = document.getElementById('form_scope3_travel');
    const modeSelect = document.getElementById("mode");
    const monthGroup = document.getElementById("month_container");
    const quarterGroup = document.getElementById("quarter_container");

    // Toggle visibility of month/quarter fields based on mode
    function toggleModeFields() {
        const selected = modeSelect.value;
        if (selected === "monthly") {
            monthGroup.classList.remove("d-none");
            quarterGroup.classList.add("d-none");
        } else if (selected === "quarterly") {
            quarterGroup.classList.remove("d-none");
            monthGroup.classList.add("d-none");
        } else {
            monthGroup.classList.add("d-none");
            quarterGroup.classList.add("d-none");
        }
    }

    modeSelect.addEventListener("change", toggleModeFields);
    toggleModeFields(); // Initial call to set visibility on load

    if (!formScope3Travel) {
        console.error('Form element not found!');
        return;
    }

    formScope3Travel.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            errorNotification("No authentication token found.", 5);
            return;
        }

        // Extract values
        const year = +document.getElementById("year").value;
        const mode = modeSelect.value;
        const month = mode === "monthly" ? document.getElementById("month").value : null;
        const quarter = mode === "quarterly" ? document.getElementById("quarter").value : null;
        const travel_type = document.getElementById("travel_type").value;
        const travel_distance_miles = parseFloat(document.getElementById("travel_distance_miles").value);
        const emission_factor = parseFloat(document.getElementById("emission_factor").value);
        const gas_type = document.getElementById("gas_type").value;
        const userGWP = parseFloat(document.getElementById("gwp").value);

        // Validation
        if (!gas_type) {
            errorNotification("Please select a gas type.", 5);
            return;
        }

        if (isNaN(userGWP)) {
            errorNotification("Please enter a valid GWP value.", 5);
            return;
        }

        // Compute total emissions (kg → metric tons)
        const emissions_kg = travel_distance_miles * emission_factor * userGWP;
        const total_emissions = emissions_kg / 1000;

        try {
            const res = await fetch(`${backendURL}/api/ghg-emission/travel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    year,
                    mode,
                    month,
                    quarter,
                    travel_type,
                    travel_distance_miles,
                    emission_factor,
                    gas_type,
                    gwp: userGWP,
                    total_emissions
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit travel emission.");
            }

            successNotification("Business Travel Emission Recorded");
            formScope3Travel.reset();
            toggleModeFields(); // Reset month/quarter display
            setTimeout(() => window.location.href = "/scope3-table.html", 3000);

        } catch (err) {
            console.error("Travel Scope Error:", err);
            errorNotification(err.message || "Failed to submit travel emission.", 5);
        }
    });
});
