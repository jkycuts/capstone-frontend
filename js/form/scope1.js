import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.getElementById('form_scope1_fuel').addEventListener('submit', async function (e) {
    e.preventDefault();

    const token = localStorage.getItem('token');
    console.log("Retrieved token:", token);

    if (!token) {
        errorNotification("No authentication token found.", 5);
        return;
    }

    // Get form values
    const year = document.getElementById('year').value;
    const mode = document.getElementById('mode').value;
    const quarter = document.getElementById('quarter').value;
    const month = document.getElementById('month').value;
    const parameter = document.getElementById('parameter').value;
    const fuel_type = document.getElementById('fuel_type').value;
    const fuel_liters_used = document.getElementById('fuel_liters_used').value;
    const emission_factor = document.getElementById('emission_factor').value;
    const gwp = document.getElementById('gwp').value;

    // Show/hide month or quarter based on selected mode
    toggleMonthQuarterFields(mode);

    // Check if "Electric Generation" is selected
    if (parameter === "electric") {
        console.log("Electric Generation selected"); // Debugging statement
    }

    // Validation check
    if (!year || !mode || !parameter || !fuel_type || !fuel_liters_used || !emission_factor || !gwp ||
        (mode === 'monthly' && !month) || (mode === 'quarterly' && !quarter)) {
        errorNotification("Please fill in all the fields.", 5);
        return;
    }

    // Prepare request data based on form input
    const requestData = {
        year,
        mode,
        parameter,
        fuel_type,
        fuel_liters_used: parseFloat(fuel_liters_used),
        emission_factor: parseFloat(emission_factor),
        gwp: parseFloat(gwp),
        ...(mode === 'monthly' ? { month } : { quarter })
    };

    try {
        // Sending the POST request
        const response = await fetch(`${backendURL}/api/ghg-emission/fuel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });

        // Handle the response
        const result = await response.json();

        if (response.ok && result.message) {
            successNotification(` ${result.message}`, 5);
            console.log("Response:", result);
        } else {
            errorNotification(` ${result.error || 'Submission failed.'}`, 5);
            console.error("Error:", result);
        }

        // Redirect after 3 seconds (optional)
        // setTimeout(() => window.location.href = "/scope1-table.html", 3000);

    } catch (error) {
        console.error("Network error:", error);
        errorNotification("Network error. Please try again later.", 5);
    }
});

// Initialize visibility based on the current mode when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const mode = document.getElementById('mode').value;
    toggleMonthQuarterFields(mode);

    // Listen for mode changes
    document.getElementById('mode').addEventListener('change', function() {
        const mode = this.value;
        toggleMonthQuarterFields(mode);
    });
});

// Function to toggle visibility of month and quarter fields based on selected mode
function toggleMonthQuarterFields(mode) {
    const monthContainer = document.getElementById('month-container');
    const quarterContainer = document.getElementById('quarter-container');
    
    if (mode === 'monthly') {
        monthContainer.style.display = 'block';   // Show month
        quarterContainer.style.display = 'none';  // Hide quarter
    } else if (mode === 'quarterly') {
        quarterContainer.style.display = 'block'; // Show quarter
        monthContainer.style.display = 'none';    // Hide month
    } else {
        monthContainer.style.display = 'none';    // Hide month
        quarterContainer.style.display = 'none';  // Hide quarter
    }
}
