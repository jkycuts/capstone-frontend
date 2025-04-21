import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.getElementById('form_scope1_fuel').addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token'); // If that's how you saved it

    console.log("Retrieved token:", token); // Debug line (can be removed in prod)

    if (!token) {
        errorNotification(" No authentication token found.", 5);
        return;
    }


    // Get form values
    const year = document.getElementById('year').value;
    const quarter = document.getElementById('quarter').value;
    const parameter = document.getElementById('parameter').value;
    const fuel_type = document.getElementById('fuel_type').value;
    const fuel_liters_used = document.getElementById('fuel_liters_used').value;

    if (!year || !quarter || !parameter || !fuel_type || !fuel_liters_used) {
        errorNotification(" Please fill in all the fields.", 5);
        return;
    }

    const requestData = {
        year,
        quarter,
        parameter,
        fuel_type,
        fuel_liters_used
    };

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/fuel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();

        if (response.ok && result.message) {
            successNotification(` ${result.message}`, 5);
            console.log("Response:", result);
        } else {
            errorNotification(` ${result.error || 'Submission failed.'}`, 5);
            console.error("Error:", result);
        }
        // Redirect after 3 seconds
        setTimeout(() => window.location.href = "/scope1-table.html", 3000);
    } catch (error) {
        console.error("Network error:", error);
        errorNotification(" Network error. Please try again later.", 5);
    }
});
