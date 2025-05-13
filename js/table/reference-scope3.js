import { backendURL, errorNotification } from '../utils/utils.js';

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadScope3ReferenceDetails() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('scope3_details_body');
    const yearFilter = document.getElementById('yearFilter');

    if (!tableBody || !yearFilter) {
        return errorNotification("Missing #scope3_details_body or #yearFilter in HTML.", 5);
    }

    if (!token) return errorNotification("No token found. Please log in.", 5);

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/travel/details`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();

        console.log("Fetched Scope 3 Data:", data);

        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="10">No Scope 3 data available.</td></tr>';
            return;
        }

        // Populate year filter
        const years = [...new Set(data.map(item => item.year))].sort((a, b) => b - a);
        yearFilter.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
        yearFilter.value = years[0];

        filterAndRenderScope3(data, yearFilter.value);

        yearFilter.addEventListener("change", () => {
            filterAndRenderScope3(data, yearFilter.value);
        });

    } catch (err) {
        console.error("Error loading Scope 3 data:", err);
        errorNotification("Failed to load Scope 3 detailed report.", 5);
    }
}

function filterAndRenderScope3(data, selectedYear) {
    const filtered = data.filter(item => item.year == selectedYear);
    renderScope3Table(filtered);
}

function renderScope3Table(data) {
    const tableBody = document.getElementById('scope3_details_body');
    tableBody.innerHTML = '';

    if (!data.length) {
        tableBody.innerHTML = '<tr><td colspan="10">No data available for selected filters.</td></tr>';
        return;
    }

    let totalCO2 = 0;
    let totalCH4 = 0;
    let totalN2O = 0;
    let totalCombined = 0;

    data.forEach((record, index) => {
        const emissions = record.emissions || {};
        const co2 = parseFloat(emissions.co2?.value ?? 0);
        const ch4 = parseFloat(emissions.ch4?.value ?? 0);
        const n2o = parseFloat(emissions.n2o?.value ?? 0);
        const emission_tco2e = co2 + ch4 + n2o;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.year ?? '-'}</td>
            <td>${capitalizeFirstLetter(record.category ?? '')}</td>
            <td>${record.quarter ?? '-'}</td>
            <td>${record.month ?? '-'}</td>
            <td>${parseFloat(record.total_distance ?? 0).toFixed(2)}</td>
            <td>${co2.toFixed(2)}</td>
            <td>${ch4.toFixed(2)}</td>
            <td>${n2o.toFixed(2)}</td>
            <td>${emission_tco2e.toFixed(2)}</td>
            <td>
                <button class="toggle-btn bg-green-500 text-white px-2 py-1 rounded text-xs" data-index="${index}">
                    Show Details
                </button>
            </td>
        `;
        tableBody.appendChild(tr);

        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('hidden');
        detailsRow.id = `details-${index}`;
        detailsRow.innerHTML = `
            <td colspan="10">
                <div class="bg-gray-50 p-4 rounded shadow text-sm">
                    <strong>Emission Factors:</strong><br>
                    CO₂: <span class="font-normal">${emissions.co2?.emission_factor ?? 'N/A'}</span> |
                    CH₄: <span class="font-normal">${emissions.ch4?.emission_factor ?? 'N/A'}</span> |
                    N₂O: <span class="font-normal">${emissions.n2o?.emission_factor ?? 'N/A'}</span><br><br>

                    <strong>Global Warming Potentials (GWP):</strong><br>
                    CO₂: <span class="font-normal">${emissions.co2?.gwp ?? 'N/A'}</span> |
                    CH₄: <span class="font-normal">${emissions.ch4?.gwp ?? 'N/A'}</span> |
                    N₂O: <span class="font-normal">${emissions.n2o?.gwp ?? 'N/A'}</span>
                </div>
            </td>
        `;
        tableBody.appendChild(detailsRow);

        totalCO2 += co2;
        totalCH4 += ch4;
        totalN2O += n2o;
        totalCombined += emission_tco2e;
    });

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="5" class="font-semibold text-right">Total</td>
        <td class="font-semibold">${totalCO2.toFixed(2)}</td>
        <td class="font-semibold">${totalCH4.toFixed(2)}</td>
        <td class="font-semibold">${totalN2O.toFixed(2)}</td>
        <td class="font-semibold">${totalCombined.toFixed(2)}</td>
        <td></td>
    `;
    tableBody.appendChild(totalRow);

    // Toggle buttons for detail rows
    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.index;
            const detailsRow = document.getElementById(`details-${index}`);
            if (!detailsRow) return;

            const isHidden = detailsRow.classList.contains('hidden');

            // Hide all
            document.querySelectorAll('tr[id^="details-"]').forEach(row => row.classList.add('hidden'));
            document.querySelectorAll('.toggle-btn').forEach(btn => btn.textContent = 'Show Details');

            if (isHidden) {
                detailsRow.classList.remove('hidden');
                button.textContent = 'Hide Details';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', loadScope3ReferenceDetails);
