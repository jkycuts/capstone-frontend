
import { backendURL, successNotification, errorNotification } from '../utils/utils.js';


form_plantation.onsubmit = async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("area_planted", document.getElementById("area_planted").value);
    formData.append("seedlings_planted", document.getElementById("seedlings_planted").value);
    formData.append("plantation_age", document.getElementById("plantation_age").value);
    formData.append("geotag_photos", document.getElementById("geotag_photos").files[0]);

    const token = localStorage.getItem('token');
    if (!token) {
        errorNotification("No authentication token found. Please log in.", 5);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/plantation`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
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

        successNotification("Plantation recorded successfully.", 5);
        form_plantation.reset();

    } catch (error) {
        console.error("Client Error:", error);
        errorNotification("Unexpected client error occurred. Please check console for details.", 5);
    }
};
