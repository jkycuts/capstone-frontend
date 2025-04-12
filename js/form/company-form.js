import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

const form_company = document.getElementById("form_company");

form_company.onsubmit = async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const location = document.getElementById("location").value;

    try {
        const response = await fetch(`${backendURL}/api/companies`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // include authorization token if needed
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, location }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Laravel validation error (422)
            if (response.status === 422) {
                let errorMsg = Object.values(data.errors).flat().join('<br>');
                errorNotification(errorMsg, 5);
            } else {
                errorNotification(data.message || "Server error occurred", 5);
            }
            return;
        }

        successNotification("Company created successfully", 5);
        form_company.reset();

    } catch (error) {
        console.error("Client Error:", error);
        errorNotification("Unexpected error occurred", 5);
    }
};
