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
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error("Failed to fetch Scope 2 records.");
        }

        // Parse the JSON response
        const scope2Data = await response.json();

        // Log the data to check its structure
        console.log("Scope 2 data:", scope2Data);

        // Clear the table before inserting new data
        tableBody.innerHTML = '';

        // Prepare an object to hold emissions data per year
        const emissionsByYear = {};

        // Populate the emissionsByYear object
        scope2Data.forEach(record => {
            const year = record.year;
            const emissionValue = parseFloat(record.emission_tco2e).toFixed(3); // Ensure number formatting

            // Initialize the year if it doesn't exist
            if (!emissionsByYear[year]) {
                emissionsByYear[year] = {
                    totalEmissions: 0,   // Total emissions for this year
                    monthlyEmissions: {} // For storing monthly emissions data
                };
            }

            // If the data is monthly or quarterly, add it to the appropriate place
            if (!emissionsByYear[year].monthlyEmissions[record.month]) {
                emissionsByYear[year].monthlyEmissions[record.month] = 0;
            }

            emissionsByYear[year].monthlyEmissions[record.month] += parseFloat(record.emission_tco2e);
            emissionsByYear[year].totalEmissions += parseFloat(record.emission_tco2e);
        });

        // Dynamically create rows for each year and month data
        Object.keys(emissionsByYear).forEach(year => {
            const yearData = emissionsByYear[year];
            let row = document.createElement('tr');
            
            // Year cell
            const tdYear = document.createElement('td');
            tdYear.textContent = year;
            row.appendChild(tdYear);

            // Add the total TCO₂ emissions for the year
            const tdTotal = document.createElement('td');
            tdTotal.textContent = yearData.totalEmissions.toFixed(3);
            row.appendChild(tdTotal);

            // Append the row to the table body
            tableBody.appendChild(row);
        });

        // Compute overall total emissions and update
        let overallTotal = 0;
        Object.values(emissionsByYear).forEach(yearData => {
            overallTotal += yearData.totalEmissions;
        });

        const overallTotalCell = document.getElementById('overall_total');
        if (overallTotalCell) {
            overallTotalCell.textContent = overallTotal.toFixed(3);
        }

    } catch (err) {
        console.error("Error loading Scope 2 inventory:", err);
        errorNotification("Unable to load Scope 2 emissions data.", 5);
    }
}

// Load on page load or tab switch
document.addEventListener('DOMContentLoaded', loadScope2Emissions);
