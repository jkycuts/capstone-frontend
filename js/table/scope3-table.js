import { backendURL, errorNotification } from '../utils/utils.js';

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function loadScope3Emissions() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope3_table_body');

    if (!token) {
        errorNotification("No token found. Please log in.", 5);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/travel`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error("Failed to fetch Scope 3 records.");
        }

        const Data = await response.json();
        console.log("Scope 3 data:", Data);

        tableBody.innerHTML = '';

        Data.forEach(record => {
            const emissionValue = parseFloat(record.emission_tco2e).toFixed(3);

            // Capitalize each word in travel_type (e.g., "short haul" -> "Short Haul")
            const travelType = record.travel_type
                .split(' ')
                .map(capitalizeFirstLetter)
                .join(' ');

            const row = `
                <tr>
                    <td>${record.year}</td>
                    <td>${travelType}</td>
                    <td>${emissionValue}</td>
                </tr>
            `;

            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error("Error loading Scope 3 inventory:", err);
        errorNotification("Unable to load Scope 3 emissions data.", 5);
    }
}

document.addEventListener('DOMContentLoaded', loadScope3Emissions);
