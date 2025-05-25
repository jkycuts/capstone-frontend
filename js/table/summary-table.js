import { backendURL, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', loadGHGSummaryTable);

async function loadGHGSummaryTable() {
    const token = localStorage.getItem('token');
    if (!token) return errorNotification("No token found.", 5);

    const endpoints = [
        { label: "Fuel Consumption", url: "/api/ghg-emission/fuel/details" },       // Scope 1
        { label: "Electricity",      url: "/api/ghg-emission/electricity/details" }, // Scope 2
        { label: "Business Travel",  url: "/api/ghg-emission/travel/details" },      // Scope 3
    ];

    const yearSet = new Set();
    const scopeData = {};

    for (const { label, url } of endpoints) {
        try {
            const res = await fetch(`${backendURL}${url}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Failed to load ${label} data (HTTP ${res.status})`);

            const response = await res.json();
            const records = Array.isArray(response) ? response : response.data;

            console.log(`✅ ${label} raw records:`, records);

            if (!Array.isArray(records)) {
                console.warn(`⚠️ ${label} response is not an array:`, records);
                continue;
            }

            scopeData[label] = {};

           records.forEach(record => {
    const year = record.year || record.emission_year;
    const emission = parseFloat(record.emission_tco2e || record.emission || 0);

    if (!year || isNaN(emission)) {
        console.warn(`❌ Skipping invalid ${label} record:`, record);
        return;
    }

    yearSet.add(year);
    if (!scopeData[label][year]) scopeData[label][year] = 0;
    scopeData[label][year] += emission;
});


        } catch (err) {
            console.error(`🚨 Error fetching ${label}:`, err);
            errorNotification(`Error loading ${label} emissions.`, 5);
        }
    }

    const years = [...yearSet].sort();
    const tableHead = document.getElementById('summary_table_head');
    const tableBody = document.getElementById('summary_table_body');
    const tableFoot = document.getElementById('summary_table_foot');

    // Build table header
    tableHead.innerHTML = `
        <tr>
            <th>Scope</th>
            ${years.map(y => `<th>${y} (tCO₂)</th>`).join('')}
            <th>Total (tCO₂)</th>
        </tr>
    `;

    // Build table body
    let grandTotal = 0;
    const yearTotals = {};
    years.forEach(y => yearTotals[y] = 0);
    tableBody.innerHTML = '';

    for (const [label, yearlyData] of Object.entries(scopeData)) {
        let row = `<tr><td>${label}</td>`;
        let rowTotal = 0;

        for (const year of years) {
            const value = yearlyData[year] || 0;
            yearTotals[year] += value;
            rowTotal += value;
            row += `<td>${value.toFixed(3)}</td>`;
        }

        grandTotal += rowTotal;
        row += `<td>${rowTotal.toFixed(3)}</td></tr>`;
        tableBody.innerHTML += row;
    }

    // Build table footer
    let footerRow = `<tr><th>Total</th>`;
    for (const year of years) {
        footerRow += `<th id="year_total_${year}">${yearTotals[year].toFixed(3)}</th>`;
    }
    footerRow += `<th id="overall_total">${grandTotal.toFixed(3)}</th></tr>`;
    tableFoot.innerHTML = footerRow;

    console.log("🟢 Final Summary Total (frontend):", grandTotal.toFixed(3));
}
