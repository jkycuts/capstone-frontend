import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('form_scope1_fuel');

    if (!form) {
        console.error("Form with id 'form_scope1_fuel' not found.");
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            errorNotification("No authentication token found.", 5);
            return;
        }

        // Get form values
        const year = document.getElementById('year')?.value;
        const mode = document.getElementById('mode')?.value;
        const quarter = document.getElementById('quarter')?.value;
        const month = document.getElementById('month')?.value;
        const parameter = document.getElementById('parameter')?.value;
        const fuel_type = document.getElementById('fuel_type')?.value;
        const fuel_liters_used = document.getElementById('fuel_liters_used')?.value;

        // Emission factors
        const co2_emission_factor = document.getElementById('co2_emission_factor')?.value;
        const ch4_emission_factor = document.getElementById('ch4_emission_factor')?.value;
        const n2o_emission_factor = document.getElementById('n2o_emission_factor')?.value;

        // GWP values
        const co2_gwp = document.getElementById('co2_gwp')?.value;
        const ch4_gwp = document.getElementById('ch4_gwp')?.value;
        const n2o_gwp = document.getElementById('n2o_gwp')?.value;

        toggleMonthQuarterFields(mode);

        // Validation
        if (!year || !mode || !parameter || !fuel_type || !fuel_liters_used ||
            !co2_emission_factor || !ch4_emission_factor || !n2o_emission_factor ||
            !co2_gwp || !ch4_gwp || !n2o_gwp ||
            (mode === 'monthly' && !month) || (mode === 'quarterly' && !quarter)) {
            errorNotification("Please fill in all the fields.", 5);
            return;
        }

        // Prepare request data
        const requestData = {
            year,
            mode,
            parameter,
            fuel_type,
            fuel_liters_used: parseFloat(fuel_liters_used),
            co2_emission_factor: parseFloat(co2_emission_factor),
            ch4_emission_factor: parseFloat(ch4_emission_factor),
            n2o_emission_factor: parseFloat(n2o_emission_factor),
            co2_gwp: parseFloat(co2_gwp),
            ch4_gwp: parseFloat(ch4_gwp),
            n2o_gwp: parseFloat(n2o_gwp),
            ...(mode === 'monthly' ? { month } : { quarter })
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
                successNotification(`${result.message}`, 5);
                form.reset();
                toggleMonthQuarterFields(document.getElementById('mode')?.value);
            } else {
                errorNotification(`${result.error || 'Submission failed.'}`, 5);
            }

        } catch (error) {
            console.error("Network error:", error);
            errorNotification("Network error. Please try again later.", 5);
        }
    });

    // Initial toggle setup
    const modeElement = document.getElementById('mode');
    if (modeElement) {
        toggleMonthQuarterFields(modeElement.value);
        modeElement.addEventListener('change', function () {
            toggleMonthQuarterFields(this.value);
        });
    }
});

function toggleMonthQuarterFields(mode) {
    const monthContainer = document.getElementById('month-container');
    const quarterContainer = document.getElementById('quarter-container');

    if (monthContainer && quarterContainer) {
        if (mode === 'monthly') {
            monthContainer.style.display = 'block';
            quarterContainer.style.display = 'none';
        } else if (mode === 'quarterly') {
            quarterContainer.style.display = 'block';
            monthContainer.style.display = 'none';
        } else {
            monthContainer.style.display = 'none';
            quarterContainer.style.display = 'none';
        }
    } else {
        console.warn("Month or quarter container element not found.");
    }
}
