
import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#form_tree-growth"); // Change this line

    if (!form) {
        console.error("Form not found!");
        return; 
    }

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        // Get the form data
        const dbh = document.getElementById("dbh").value;
        const height = document.getElementById("height").value;
        const latitude = document.getElementById("latitude").value;
        const longitude = document.getElementById("longitude").value;

        // Basic validation
        if (!dbh || !height || !latitude || !longitude) {
            errorNotification("Please fill in all fields.", 5);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                errorNotification("No authentication token found. Please log in.", 5);
                return;
            }

            const response = await fetch(`${backendURL}/api/tree-growth`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    dbh,
                    height,
                    latitude,
                    longitude
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

            successNotification("Tree growth data recorded successfully.", 5);
            form.reset();

        } catch (error) {
            console.error("Client Error:", error);
            errorNotification("Unexpected client error occurred. Please check console for details.", 5);
        }
    };
});
