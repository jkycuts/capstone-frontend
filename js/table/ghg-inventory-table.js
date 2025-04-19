import { backendURL, errorNotification } from '../utils/utils.js';

async function loadGHGInventory() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('ghg_table_body');

    if (!token) {
        errorNotification("No token found. Please log in.", 5);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch GHG records.");
        }

        const ghgData = await response.json();
        tableBody.innerHTML = ''; // Clear table

        ghgData.forEach(record => {
            const row = `
                <tr>
                    <td>${record.year}</td>
                    <td>${record.quarter}</td>
                    <td>${record.fuel_source}</td>
                    <td>${record.fuel_type}</td>
                    <td>${record.fuel_liters_used}</td>
                    <td>${record.electricity_kwh}</td>
                    <td>${record.travel_category}</td>
                    <td>${record.travel_distance_miles}</td>
                    <td>${parseFloat(record.fuel_tco2 || 0).toFixed(4)}</td>
                    <td>${parseFloat(record.electricity_tco2 || 0).toFixed(4)}</td>
                    <td>${parseFloat(record.travel_tco2 || 0).toFixed(4)}</td>
                    <td>${parseFloat(record.total_tco2 || 0).toFixed(4)}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error("Error loading GHG inventory:", err);
        errorNotification("Unable to load GHG emissions data.", 5);
    }
}

// Load on page load or tab switch
document.addEventListener('DOMContentLoaded', loadGHGInventory);
