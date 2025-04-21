import { backendURL, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', loadGHGSummary);

async function loadGHGSummary() {
    const token = localStorage.getItem('token');
    if (!token) {
        errorNotification("No token found. Please log in.", 5);
        return;
    }

    try {
        const [scope1, scope2, scope3] = await Promise.all([
            fetchScopeData(`${backendURL}/api/ghg-emission/fuel`, token),
            fetchScopeData(`${backendURL}/api/ghg-emission/electricity`, token),
            fetchScopeData(`${backendURL}/api/ghg-emission/travel`, token),
        ]);

        console.log("Scope 1:", scope1);
        console.log("Scope 2:", scope2);
        console.log("Scope 3:", scope3);

        const summaryData = {
            'Scope 1': summarize(scope1),
            'Scope 2': summarize(scope2),
            'Scope 3': summarize(scope3)
        };

        renderSummary(summaryData);

        

    } catch (err) {
        console.error("Failed to load summary data:", err);
        errorNotification("Error loading emissions summary.", 5);
    }
}

async function fetchScopeData(url, token) {
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fetch failed: ${errorText}`);
    }

    return await response.json();
}

function summarize(records) {
    const yearlyTotals = {
        2021: 0,
        2022: 0,
        2023: 0,
        2024: 0
    };

    records.forEach(record => {
        const year = parseInt(record.year);
        const emission = parseFloat(record.emission_tco2e);
        if (yearlyTotals[year] !== undefined) {
            yearlyTotals[year] += emission;
        }
    });

    yearlyTotals.total = Object.values(yearlyTotals).reduce((sum, v) => sum + v, 0);
    return yearlyTotals;
}

function renderSummary(data) {
    const tbody = document.getElementById('summary_table_body');
    const totalsByYear = { 2021: 0, 2022: 0, 2023: 0, 2024: 0 };
    let overallTotal = 0;

    tbody.innerHTML = '';

    Object.entries(data).forEach(([scope, emissions]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${scope}</td>
            <td>${emissions[2021].toFixed(3)}</td>
            <td>${emissions[2022].toFixed(3)}</td>
            <td>${emissions[2023].toFixed(3)}</td>
            <td>${emissions[2024].toFixed(3)}</td>
            <td>${emissions.total.toFixed(3)}</td>
        `;
        tbody.appendChild(row);

        // Totals per year
        totalsByYear[2021] += emissions[2021];
        totalsByYear[2022] += emissions[2022];
        totalsByYear[2023] += emissions[2023];
        totalsByYear[2024] += emissions[2024];
        overallTotal += emissions.total;
    });

    // Update footer totals
    document.getElementById('year_total_2021').textContent = totalsByYear[2021].toFixed(3);
    document.getElementById('year_total_2022').textContent = totalsByYear[2022].toFixed(3);
    document.getElementById('year_total_2023').textContent = totalsByYear[2023].toFixed(3);
    document.getElementById('year_total_2024').textContent = totalsByYear[2024].toFixed(3);
    document.getElementById('overall_total').textContent = overallTotal.toFixed(3);

    // ✅ Update dashboard GHG emission display
    const totalDisplay = document.getElementById('total_ghg_emission');
    if (totalDisplay) {
        totalDisplay.textContent = overallTotal.toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        }) + ' tCO₂e';
    }
}
