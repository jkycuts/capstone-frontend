import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const form_ghg_emission = document.getElementById("form_ghg_emission");
    if (!form_ghg_emission) {
        console.warn("form_ghg_emission not found");
        return;
    }

    const submitBtn = form_ghg_emission.querySelector("button[type=submit]");

    form_ghg_emission.onsubmit = async function (e) {
        e.preventDefault();

        const year = document.getElementById("year").value;
        const quarter = document.getElementById("quarter").value;
        const fuel_source = document.getElementById("fuel_source").value;
        const fuel_type = document.getElementById("fuel_type").value;
        const fuel_liters_used = document.getElementById("fuel_liters_used").value;
        const electricity_kwh = document.getElementById("electricity_kwh").value;
        const travel_category = document.getElementById("travel_category").value;
        const travel_number_of_trips = document.getElementById("travel_number_of_trips").value;
        const travel_distance_miles = document.getElementById("travel_distance_miles").value;
        const date_recorded = document.getElementById("date_recorded").value;

        // Basic required fields check
        if (!year || !quarter || !fuel_source || !fuel_type || !fuel_liters_used ||
            !electricity_kwh || !travel_category || !travel_number_of_trips || !travel_distance_miles) {
            errorNotification("Please fill in all required fields.", 5);
            return;
        }

        // Parse and validate numeric values
        const parsedFuelLiters = parseFloat(fuel_liters_used);
        const parsedElectricityKwh = parseFloat(electricity_kwh);
        const parsedTravelTrips = parseInt(travel_number_of_trips);
        const parsedTravelDistance = parseFloat(travel_distance_miles);

        if (isNaN(parsedFuelLiters) || isNaN(parsedElectricityKwh) || isNaN(parsedTravelTrips) || isNaN(parsedTravelDistance)) {
            errorNotification("Please ensure all numerical fields are valid.", 5);
            return;
        }

        // Date validation
        const parsedDateRecorded = new Date(date_recorded);
        if (isNaN(parsedDateRecorded.getTime())) {
            errorNotification("Invalid date format for the date recorded.", 5);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                errorNotification("No authentication token found. Please log in.", 5);
                return;
            }

            submitBtn.disabled = true;

            const response = await fetch(`${backendURL}/api/ghg-emission`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // ✅ Important fix
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    year: parseInt(year),
                    quarter,
                    fuel_source,
                    fuel_type,
                    fuel_liters_used: parsedFuelLiters,
                    electricity_kwh: parsedElectricityKwh,
                    travel_category,
                    travel_number_of_trips: parsedTravelTrips,
                    travel_distance_miles: parsedTravelDistance,
                    date_recorded,
                })
            });

            if (!response.ok) {
                const errorJson = await response.json();
                console.error("Validation Error:", errorJson);

                if (errorJson.errors) {
                    const details = Object.values(errorJson.errors).flat().join('<br>');
                    errorNotification(details, 5);
                } else {
                    errorNotification(errorJson.message || "Validation failed", 5);
                }

                return;
            }

            const data = await response.json();
            console.log("Success:", data);

            const emissions = data.emissions;
            successNotification(
                `GHG emission recorded successfully.<br>
                <b>Total Emission:</b> ${emissions.total_tco2.toFixed(3)} TCO₂<br>
                <b>Fuel:</b> ${emissions.fuel_tco2.toFixed(3)}<br>
                <b>Electricity:</b> ${emissions.electricity_tco2.toFixed(3)}<br>
                <b>Travel:</b> ${emissions.business_travel_tco2.toFixed(3)}`,
                5
            );

            form_ghg_emission.reset();

            setTimeout(() => {
                window.location.href = "/ghg-emission-table.html";
            }, 3000);

        } catch (error) {
            console.error("Client Error:", error);
            errorNotification("Unexpected client error occurred. Please check console for details.", 5);
        } finally {
            submitBtn.disabled = false;
        }
    };
});
