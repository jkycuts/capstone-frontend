import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('form_scope2_electricity');

    if (!form) {
        console.error('Form element not found!');
        return;
    }

    // Toggle month/quarter inputs based on mode
    const modeSelect = document.getElementById("mode");
    const monthGroup = document.getElementById("month_group");
    const quarterGroup = document.getElementById("quarter_group");

    modeSelect.addEventListener("change", function () {
        const selected = this.value;
        if (selected === "monthly") {
            monthGroup.style.display = "block";
            quarterGroup.style.display = "none";
        } else if (selected === "quarterly") {
            monthGroup.style.display = "none";
            quarterGroup.style.display = "block";
        }
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            errorNotification("No authentication token found.", 5);
            return;
        }

        const mode = document.getElementById("mode")?.value;
        const year = parseInt(document.getElementById("year")?.value);
        const month = document.getElementById("month")?.value;
        const quarter = document.getElementById("quarter")?.value;
        const electricity_kwh = parseFloat(document.getElementById("electricity_kwh")?.value);
        const emission_factor = parseFloat(document.getElementById("emission_factor")?.value);

        if (!mode || !year || isNaN(electricity_kwh) || isNaN(emission_factor) ||
            (mode === 'monthly' && !month) ||
            (mode === 'quarterly' && !quarter)) {
            errorNotification("Please fill in all required fields.", 5);
            return;
        }

        const total_emissions = (electricity_kwh * emission_factor) / 1000;

        const payload = {
            mode,
            year,
            month: mode === 'monthly' ? month : null,
            quarter: mode === 'quarterly' ? quarter : null,
            electricity_kwh,
            emission_factor,
            total_emissions
        };

        try {
            const res = await fetch(`${backendURL}/api/ghg-emission/electricity`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit electricity emission");
            }

            successNotification(`Electricity Emission Recorded`);
            form.reset();
            monthGroup.style.display = "none";
            quarterGroup.style.display = "none";

            setTimeout(() => window.location.href = "/scope2-table.html", 3000);
        } catch (err) {
            console.error("Electricity Scope Error:", err);
            errorNotification(err.message || "Failed to submit electricity emission", 5);
        }
    });
});
