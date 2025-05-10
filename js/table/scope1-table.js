import { backendURL, errorNotification } from '../utils/utils.js';

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function loadScope1Emissions() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope1_table_body');
    const tableHeadRow = document.getElementById('scope1_table_header');
    const yearlyTotalsRow = document.getElementById('yearly_totals_row');
    const loadingMessage = document.getElementById('loading-message');

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (!token) return errorNotification("No token found. Please log in.", 5);

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/fuel`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(await response.text());

        const scope1Data = await response.json();
        if (!Array.isArray(scope1Data) || scope1Data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="99">No data available for Scope 1 emissions.</td></tr>';
            return;
        }

        // Step 1: Extract unique years and parameters
        const years = [...new Set(scope1Data.map(d => d.year).filter(Boolean))].sort();
        const parameters = ['Transportation', 'Production', 'Electric Generation'];

        // Step 2: Build header
        tableHeadRow.innerHTML = '<th>Parameter</th>';
        years.forEach(year => {
            tableHeadRow.innerHTML += `<th data-year="${year}">${year}</th>`;
        });
        tableHeadRow.innerHTML += `<th>Total TCO₂</th>`;

        // Step 3: Initialize row map
        tableBody.innerHTML = '';
        const rowMap = {};
        parameters.forEach(param => {
            const row = document.createElement('tr');
            row.setAttribute('data-parameter', param);
            row.innerHTML = `<td>${param}</td>`;
            years.forEach(year => {
                row.innerHTML += `<td data-year="${year}" class="emission-cell" data-value="0">0.00</td>`;
            });
            row.innerHTML += `<td class="total-emission">0.00</td>`;
            tableBody.appendChild(row);
            rowMap[param.toLowerCase()] = row;
        });

        // Step 4: Populate data
        scope1Data.forEach(record => {
            const year = record.year;
            const parameter = (record.parameter || '').toLowerCase();
            const emission = parseFloat(record.emission_tco2e) || 0;

            const row = rowMap[parameter];
            if (!row) return;

            const cell = row.querySelector(`td[data-year="${year}"]`);
            const prev = parseFloat(cell.getAttribute('data-value')) || 0;
            const newTotal = prev + emission;

            cell.setAttribute('data-value', newTotal.toFixed(2));
            cell.textContent = newTotal.toFixed(2);
        });

        // Step 5: Calculate totals
        let overallTotal = 0;
        const columnTotals = {};

        // Row totals
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

        // Column totals
        yearlyTotalsRow.innerHTML = '<td><strong>Total per Year</strong></td>';
        years.forEach(year => {
            const total = columnTotals[year] || 0;
            yearlyTotalsRow.innerHTML += `<td><strong>${total.toFixed(2)}</strong></td>`;
        });
        yearlyTotalsRow.innerHTML += `<td id="overall_total"><strong>${overallTotal.toFixed(2)}</strong></td>`;

    } catch (err) {
        console.error("Error loading Scope 1 inventory:", err);
        errorNotification("Unable to load Scope 1 emissions data.", 5);
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }
}

// Load on page load or tab switch
document.addEventListener('DOMContentLoaded', loadScope1Emissions);





