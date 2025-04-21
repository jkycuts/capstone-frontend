import { backendURL, errorNotification } from '../utils/utils.js';

async function loadScope2Emissions() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope2_table_body');

    if (!token) {
        errorNotification("No token found. Please log in.", 5);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/electricity`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();  // Read error text
            console.error("Error response:", errorText);  // Log error text
            throw new Error("Failed to fetch Scope 2 records.");
        }

        // Parse the JSON response
        const scope2Data = await response.json();

        // Log the data to check its structure
        console.log("Scope 2 data:", scope2Data);

        // Clear the table before inserting new data
        tableBody.innerHTML = '';

        // Populate the table with Scope 2 records
        scope2Data.forEach(record => {
            const year = record.year;
            const emissionValue = parseFloat(record.emission_tco2e).toFixed(3); // Ensure number formatting
            
            // Create a table row for each record
            const row = `
                <tr>
                    <td>${year}</td>
                    <td>${record.electricity_kwh}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error("Error loading Scope 2 inventory:", err);
        errorNotification("Unable to load Scope 2 emissions data.", 5);
    }
}

// Load on page load or tab switch
document.addEventListener('DOMContentLoaded', loadScope2Emissions);
