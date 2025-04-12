import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

const form_plantation = document.getElementById("form_plantation");

form_plantation.onsubmit = async function (e) {
    e.preventDefault();

    const area_planted = document.getElementById("area_planted").value;
    const seedlings_planted = document.getElementById("seedlings_planted").value;
    const plantation_age = document.getElementById("plantation_age").value;
    const geotag_photos = document.getElementById("geotag_photos").value;

    try {
        const token = localStorage.getItem('token');

        if (!token) {
            errorNotification("No authentication token found. Please log in.", 5);
            return;
        }

        const response = await fetch(`${backendURL}/api/plantation`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json", // force Laravel to return JSON
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                area_planted,
                seedlings_planted,
                plantation_age,
                geotag_photos,
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

        successNotification("Plantation recorded successfully.", 5);
        form_ghg_emission.reset();

    } catch (error) {
        console.error("Client Error:", error);
        errorNotification("Unexpected client error occurred. Please check console for details.", 5);
    }
};
