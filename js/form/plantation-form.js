import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const form_company = document.getElementById("form_plantation");

    if (!form_company) {
        // console.warn("form_plantation not found");
        return;
    }

    form_company.onsubmit = async function (e) {
        e.preventDefault();

        const area_planted = document.getElementById("area_planted").value;
        const seedlings_planted = document.getElementById("seedlings_planted").value;
        const plantation_age = document.getElementById("plantation_age").value;
        const date_recorded = document.getElementById("date_recorded").value;

        try {
            const response = await fetch(`${backendURL}/api/plantation`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ area_planted, seedlings_planted, plantation_age, date_recorded }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    let errorMsg = Object.values(data.errors).flat().join('<br>');
                    errorNotification(errorMsg, 5);
                } else {
                    errorNotification(data.message || "Server error occurred", 5);
                }
                return;
            }

            successNotification("Plantation created successfully", 5);
            form_company.reset();

            // Delay then redirect
            setTimeout(() => {
                window.location.href = "/tree-growth.html"; // Modify path as needed
            }, 3000);

        } catch (error) {
            console.error("Client Error:", error);
            errorNotification("Unexpected error occurred", 5);
        }
    };
});
