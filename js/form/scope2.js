import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('form_scope2_electricity');

    if (!form) {
        console.error('Form element not found!');
        return;
    }

    console.log('Form found:', form);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            errorNotification("No authentication token found.", 5);
            return;
        }

        // Safe DOM access with null checks
        const yearInput = document.getElementById("year");
        const quarterInput = document.getElementById("quarter");
        const electricityInput = document.getElementById("electricity_kwh");

        if (!yearInput || !quarterInput || !electricityInput) {
            errorNotification("Some form elements are missing in the DOM.", 5);
            console.error("Missing form elements:", { yearInput, quarterInput, electricityInput });
            return;
        }

        console.log('Year Input:', yearInput.value);
        console.log('Quarter Input:', quarterInput.value);
        console.log('Electricity Input:', electricityInput.value);

        const year = parseInt(yearInput.value);
        const quarter = quarterInput.value;
        const electricity_kwh = parseFloat(electricityInput.value);

        if (!year || !quarter || isNaN(electricity_kwh)) {
            errorNotification("Fill in all required fields.", 5);
            console.error('Invalid input values:', { year, quarter, electricity_kwh });
            return;
        }

        const mwh = electricity_kwh / 1000;
        const factor = 0.496;
        const total_emissions = mwh * factor;

        try {
            console.log('Submitting data to the backend:', { year, quarter, electricity_kwh, total_emissions });

            const res = await fetch(`${backendURL}/api/ghg-emission/electricity`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    year,
                    quarter,
                    electricity_kwh,
                    total_emissions
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit electricity emission");
            }

            successNotification(`Electricity Emission Recorded`);
            form.reset();

            setTimeout(() => window.location.href = "/scope2-table.html", 3000);
        } catch (err) {
            console.error("Electricity Scope Error:", err);
            errorNotification(err.message || "Failed to submit electricity emission", 5);
        }
    });
});
