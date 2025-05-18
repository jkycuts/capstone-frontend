import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
    const formScope3Travel = document.getElementById('form_scope3_travel');
    const modeSelect = document.getElementById("mode");
    const monthGroup = document.getElementById("month_container");
    const quarterGroup = document.getElementById("quarter_container");

    // Toggle visibility of month/quarter fields based on mode
    function toggleModeFields() {
        const selected = modeSelect.value;
        if (selected === "monthly") {
            monthGroup.classList.remove("d-none");
            quarterGroup.classList.add("d-none");
        } else if (selected === "quarterly") {
            quarterGroup.classList.remove("d-none");
            monthGroup.classList.add("d-none");
        } else {
            monthGroup.classList.add("d-none");
            quarterGroup.classList.add("d-none");
        }
    }

    modeSelect.addEventListener("change", toggleModeFields);
    toggleModeFields(); // Initial call to set visibility on load

    if (!formScope3Travel) {
        console.error('Form element not found!');
        return;
    }

    formScope3Travel.addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        errorNotification("No authentication token found.", 5);
        return;
    }

    // Extract values
    const year = +document.getElementById("year").value;
    const mode = modeSelect.value;
    const month = mode === "monthly" ? document.getElementById("month").value : null;
    const quarter = mode === "quarterly" ? document.getElementById("quarter").value : null;
    const travel_type = document.getElementById("travel_type").value;
    const travel_distance_miles = parseFloat(document.getElementById("travel_distance_miles").value);

    const co2_emission_factor = parseFloat(document.getElementById("co2_emission_factor").value);
    const ch4_emission_factor = parseFloat(document.getElementById("ch4_emission_factor").value);
    const n2o_emission_factor = parseFloat(document.getElementById("n2o_emission_factor").value);

    const co2_gwp = parseFloat(document.getElementById("_co2_gwp").value);
    const ch4_gwp = parseFloat(document.getElementById("ch4_gwp").value);
    const n2o_gwp = parseFloat(document.getElementById("n2o_gwp").value);

    // Validation
    if (
        [co2_emission_factor, ch4_emission_factor, n2o_emission_factor, co2_gwp, ch4_gwp, n2o_gwp]
            .some(val => isNaN(val))
    ) {
        errorNotification("Please fill in all emission factors and GWP values correctly.", 5);
        return;
    }

    // Compute emissions per gas (kg → metric tons)
    const co2_emissions = (travel_distance_miles * co2_emission_factor * co2_gwp);
    const ch4_emissions = (travel_distance_miles * ch4_emission_factor * ch4_gwp);
    const n2o_emissions = (travel_distance_miles * n2o_emission_factor * n2o_gwp);

    const total_emissions = co2_emissions + ch4_emissions + n2o_emissions;

    try {
        const res = await fetch(`${backendURL}/api/ghg-emission/travel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                year,
                mode,
                month,
                quarter,
                travel_type,
                travel_distance_miles,
                co2_emission_factor,
                ch4_emission_factor,
                n2o_emission_factor,
                co2_gwp,
                ch4_gwp,
                n2o_gwp,
                co2_emissions,
                ch4_emissions,
                n2o_emissions,
                total_emissions
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Failed to submit travel emission.");
        }

        successNotification("Business Travel Emission Recorded");
        formScope3Travel.reset();
        toggleModeFields(); // Reset month/quarter display
        setTimeout(() => window.location.href = "/scope3-table.html", 3000);

    } catch (err) {
        console.error("Travel Scope Error:", err);
        errorNotification(err.message || "Failed to submit travel emission.", 5);
    }
});

});
