import { backendURL, errorNotification } from '../utils/utils.js';

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

async function loadScope2ReferenceDetails() {
    const token = localStorage.getItem('token');
    const yearFilter = document.getElementById('yearFilter');
    const tableBody = document.getElementById('scope2_details_body');

    if (!token) return errorNotification("No token found. Please log in.", 5);
    if (!tableBody) return console.error("Missing table body element (scope2_details_body).");

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/electricity/details`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No Scope 2 reference data available.</td></tr>';
            return;
        }

        const years = [...new Set(data.map(item => item.year))].sort((a, b) => b - a);
        if (yearFilter) {
            yearFilter.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
        }

        filterAndRender(data, yearFilter?.value);

        if (yearFilter) {
            yearFilter.addEventListener('change', debounce(() => {
                filterAndRender(data, yearFilter.value);
            }, 300));
        }

    } catch (err) {
        console.error("Error loading Scope 2 reference data:", err);
        errorNotification("Failed to load Scope 2 details.", 5);
    }
}

function filterAndRender(data, selectedYear) {
    const filtered = data.filter(item => item.year == selectedYear);
    renderScope2Table(filtered);
}

function renderScope2Table(data) {
    const tableBody = document.getElementById('scope2_details_body');
    tableBody.innerHTML = '';

    if (!data.length) {
        tableBody.innerHTML = '<tr><td colspan="6">No data available for selected year.</td></tr>';
        return;
    }

    let totalKwh = 0;
    let totalEmissions = 0;

    data.forEach(record => {
        const tr = document.createElement('tr');
        const emission = parseFloat(record.emission_tco2e || 0);
        const kwh = parseFloat(record.total_kwh || 0);
        const monthName = record.month ? monthNames[record.month - 1] : '—';
        const quarter = record.month ? `Q${Math.ceil(record.month / 3)}` : (record.quarter || '—');

        totalKwh += kwh;
        totalEmissions += emission;

        tr.innerHTML = `
            <td>${record.year}</td>
            <td>${quarter}</td>
            <td>${monthName}</td>
            <td>${kwh.toLocaleString()} </td>
            <td>${parseFloat(record.emission_factor).toFixed(4)}</td>
            <td>${(emission / 1000).toFixed(4)}</td>
        `;
        tableBody.appendChild(tr);
    });

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="3" class="font-bold text-right">Total</td>
        <td class="font-bold">${totalKwh.toLocaleString()} kWh</td>
        <td></td>
        <td class="font-bold">${(totalEmissions / 1000).toFixed(4)}</td>

    `;
    tableBody.appendChild(totalRow);
}


document.addEventListener('DOMContentLoaded', loadScope2ReferenceDetails);
