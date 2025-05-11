import { backendURL, errorNotification } from '../utils/utils.js';

async function loadScope3Emissions() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope3_table_body');
    const tableHeadRow = document.getElementById('scope3_table_header');
    const yearlyTotalsRow = document.getElementById('yearly_totals_row');
    const loadingMessage = document.getElementById('loading-message');

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (!token) return errorNotification("No token found. Please log in.", 5);

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/travel`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(await response.text());

        const scope3Data = await response.json();
        if (!Array.isArray(scope3Data) || scope3Data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="99">No data available for Scope 3 emissions.</td></tr>';
            return;
        }

        // Step 1: Extract unique years
        const years = [...new Set(scope3Data.map(d => d.year).filter(Boolean))].sort();

        // Step 2: Travel type mapping
        const travelTypeMap = {
            short: 'Short Haul',
            medium: 'Medium Haul',
            long: 'Long Haul'
        };
        const travelKeys = Object.keys(travelTypeMap);

        // Step 3: Build table header
        tableHeadRow.innerHTML = '<th>Category</th>';
        years.forEach(year => {
            tableHeadRow.innerHTML += `<th data-year="${year}">${year}</th>`;
        });
        tableHeadRow.innerHTML += `<th>Total TCO₂</th>`;

        // Step 4: Build rows
        tableBody.innerHTML = '';
        const rowMap = {};
        travelKeys.forEach(key => {
            const row = document.createElement('tr');
            row.setAttribute('data-travel_type', key);
            row.innerHTML = `<td>${travelTypeMap[key]}</td>`;
            years.forEach(year => {
                row.innerHTML += `<td data-year="${year}" class="emission-cell" data-value="0">0.00</td>`;
            });
            row.innerHTML += `<td class="total-emission">0.00</td>`;
            tableBody.appendChild(row);
            rowMap[key] = row;
        });

        // Step 5: Populate data
        scope3Data.forEach(record => {
            const year = record.year;
            const travelKey = (record.travel_type || '').toLowerCase().trim(); // 'short', 'medium', 'long'
            const emission = parseFloat(record.emission_tco2e) || 0;

            const row = rowMap[travelKey];
            if (!row) return;

            const cell = row.querySelector(`td[data-year="${year}"]`);
            if (!cell) return;

            const prev = parseFloat(cell.getAttribute('data-value')) || 0;
            const newTotal = prev + emission;

            cell.setAttribute('data-value', newTotal.toFixed(2));
            cell.textContent = newTotal.toFixed(2);
        });

        // Step 6: Calculate row and column totals
        let overallTotal = 0;
        const columnTotals = {};

        tableBody.querySelectorAll('tr').forEach(row => {
            let rowTotal = 0;
            years.forEach(year => {
                const cell = row.querySelector(`td[data-year="${year}"]`);
                const value = parseFloat(cell.getAttribute('data-value')) || 0;
                rowTotal += value;
                columnTotals[year] = (columnTotals[year] || 0) + value;
            });
            row.querySelector('.total-emission').textContent = rowTotal.toFixed(2);
            overallTotal += rowTotal;
        });

        // Step 7: Populate footer totals
        yearlyTotalsRow.innerHTML = '<td class="fw-semibold">Total per Year</td>';
        years.forEach(year => {
            const total = columnTotals[year] || 0;
            yearlyTotalsRow.innerHTML += `<td><strong>${total.toFixed(2)}</strong></td>`;
        });
        yearlyTotalsRow.innerHTML += `<td id="overall_total"><strong>${overallTotal.toFixed(2)}</strong></td>`;

    } catch (err) {
        console.error("Error loading Scope 3 inventory:", err);
        errorNotification("Unable to load Scope 3 emissions data.", 5);
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', loadScope3Emissions);
