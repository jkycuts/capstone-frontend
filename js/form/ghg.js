import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

const form_ghg_emission = document.getElementById("form_ghg_emission");

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

    try {
        const token = localStorage.getItem('token');

        if (!token) {
            errorNotification("No authentication token found. Please log in.", 5);
            return;
        }

        const response = await fetch(`${backendURL}/api/ghg-emission`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json", // force Laravel to return JSON
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                year,
                quarter,
                fuel_source,
                fuel_type,
                fuel_liters_used,
                electricity_kwh,
                travel_category,
                travel_number_of_trips,
                travel_distance_miles
            }),
        });

        const contentType = response.headers.get("content-type");

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

        successNotification("GHG emission recorded successfully.", 5);
        form_ghg_emission.reset();

    } catch (error) {
        console.error("Client Error:", error);
        errorNotification("Unexpected client error occurred. Please check console for details.", 5);
    }
};
