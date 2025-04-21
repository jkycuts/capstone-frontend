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

           
                // Example travel distance in miles
                const activity_data = travel_distance_miles;

                // Choose emission factor based on travel distance
                let co2_factor;

                if (activity_data <= 300) {
                    co2_factor = 0.277; // Short haul
                } else if (activity_data > 300 && activity_data <= 700) {
                    co2_factor = 0.229; // Medium haul
                } else {
                    co2_factor = 0.185; // Long haul
                }

                // GWP values (can be fetched from backend if needed)
                const gwp = {
                    co2: 1,
                    ch4: 25,
                    n2o: 298
                };

                // Apply formulas
                const travel_co2 = activity_data * co2_factor * gwp.co2;
                const travel_ch4 = activity_data * 0.0000104 * gwp.ch4;
                const travel_n2o = activity_data * 0.0000085 * gwp.n2o;

                const travel_total_kg = travel_co2 + travel_ch4 + travel_n2o;
                const total_emissions = travel_total_kg / 1000; // Convert to metric tons


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
                        total_emissions
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || "Failed to submit Air Travel Emission",5);
                }

                successNotification(`Air Travel Emission Recorded`);

                // Reset the form after successful submission
                document.getElementById('form_scope3_travel').reset();

                // Redirect after 3 seconds
                setTimeout(() => window.location.href = "/scope3-table.html", 3000);
            } catch (err) {
                console.error("Electricity Scope Error:", err);
                errorNotification(err.message || "Failed to submit Air Travel Emission", 5);
            }
        });
    } else {
        console.error('Form element not found!');
    }
});
