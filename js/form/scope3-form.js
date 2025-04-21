import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
    const formScope2Electricity = document.getElementById('form_scope3_travel');
    
    // Ensure the form exists before trying to add the event listener
    if (formScope2Electricity) {
        formScope2Electricity.addEventListener('submit', async function (e) {
            e.preventDefault();

            const token = localStorage.getItem('token'); // If that's how you saved it

            console.log("Retrieved token:", token); // Debug line (can be removed in prod)

            if (!token) {
                errorNotification("No authentication token found.", 5);
                return;
            }

            // Get form values
            const year = +document.getElementById("year").value;
            const travel_type = document.getElementById("travel_type").value;
            const travel_distance_miles = parseFloat(document.getElementById("travel_distance_miles").value);

           

            const mwh = travel_distance_miles / 1000;
            const factor = 0.496;
            const electricityEmissions = mwh * factor;

            try {
                const res = await fetch(`${backendURL}/api/ghg-emission/travel`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        year,
                        travel_type,
                        travel_distance_miles,
                        total_emissions: electricityEmissions
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to submit electricity emission");
                }

                successNotification(`Electricity emission recorded. <b>${electricityEmissions.toFixed(3)}</b> TCO₂`, 5);

                // Reset the form after successful submission
                document.getElementById('form_scope3_travel').reset();

                // Redirect after 3 seconds
                setTimeout(() => window.location.href = "/scope3-table.html", 3000);
            } catch (err) {
                console.error("Electricity Scope Error:", err);
                errorNotification(err.message || "Failed to submit electricity emission", 5);
            }
        });
    } else {
        console.error('Form element not found!');
    }
});
