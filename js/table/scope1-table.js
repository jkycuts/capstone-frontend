import { backendURL, errorNotification } from '../utils/utils.js';

async function loadScope1Emissions() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope1_table_body');
    const loadingMessage = document.getElementById('loading-message'); // Optional: You can have a loading message element.

    // Display loading state
    if (loadingMessage) {
        loadingMessage.style.display = 'block'; // Show loading message
    }

    if (!token) {
        errorNotification("No token found. Please log in.", 5);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/fuel`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();  // Read the response text
            console.error("Error response:", errorText);  // Log error text
            throw new Error("Failed to fetch Scope 1 records.");
        }

        // Try to parse the response as JSON
        const scope1Data = await response.json();

        // Log the data for debugging
        console.log("Scope 1 data:", scope1Data);

        // Clear the existing table body
        tableBody.innerHTML = '';

        // Check if there is any data
        if (scope1Data && Array.isArray(scope1Data) && scope1Data.length > 0) {
            scope1Data.forEach(record => {
                // Handle undefined properties to avoid breaking the table
                const parameter = record.parameter || 'N/A';
                const year = record.year || 'N/A';
                const emission_tco2e = record.emission_tco2e || '0.00';

                const row = `
                    <tr>
                        <td>${parameter}</td>
                        <td>${year}</td>
                        <td>${emission_tco2e}</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="3">No data available for Scope 1 emissions.</td></tr>';
        }

    } catch (err) {
        console.error("Error loading Scope 1 inventory:", err);
        errorNotification("Unable to load Scope 1 emissions data.", 5);
    } finally {
        // Hide loading state after the data is loaded
        if (loadingMessage) {
            loadingMessage.style.display = 'none'; // Hide loading message
        }
    }
}

// Load on page load or tab switch
document.addEventListener('DOMContentLoaded', loadScope1Emissions);
