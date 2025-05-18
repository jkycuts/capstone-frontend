import { backendURL, errorNotification } from '../utils/utils.js';

// Capitalize the first letter of a string
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Debounce function to avoid multiple requests on quick filter changes
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Load Scope 1 Reference Details
async function loadScope1ReferenceDetails() {
    const token = localStorage.getItem('token');
    const yearFilter = document.getElementById('yearFilter');
    const fuelTypeFilter = document.getElementById('fuelTypeFilter');
    const tableBody = document.getElementById('scope1_details_body');

    if (!token) return errorNotification("No token found. Please log in.", 5);

    try {
        const response = await fetch(`${backendURL}/api/ghg-emission/fuel/details`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="11">No reference data available.</td>';
            tableBody.appendChild(emptyRow);
            return;
        }

        // Populate year filter
        const years = [...new Set(data.map(item => item.year))].sort((a, b) => b - a);
        yearFilter.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');

        // Populate fuel type filter
        const fuelTypes = [...new Set(data.map(item => item.fuel_type))].sort();
        fuelTypeFilter.innerHTML = `<option value="">All</option>` 
            + fuelTypes.map(ft => `<option value="${ft}">${capitalizeFirstLetter(ft)}</option>`).join('');

        // Initial render (latest year, all fuel types)
        filterAndRender(data, yearFilter.value, fuelTypeFilter.value);

        // Event listeners with debounce for filtering
        yearFilter.addEventListener('change', debounce(() => {
            filterAndRender(data, yearFilter.value, fuelTypeFilter.value);
        }, 300));

        fuelTypeFilter.addEventListener('change', debounce(() => {
            filterAndRender(data, yearFilter.value, fuelTypeFilter.value);
        }, 300));

    } catch (err) {
        console.error("Error loading Scope 1 reference data:", err);
        errorNotification("Failed to load Scope 1 detailed report.", 5);
    }
}

// Filter data based on selected year and fuel type, then render the table
function filterAndRender(data, selectedYear, selectedFuelType) {
    const filtered = data.filter(item => {
        return item.year == selectedYear && (selectedFuelType === "" || item.fuel_type === selectedFuelType);
    });
    renderScope1Table(filtered);
}

// Render the filtered Scope 1 data into the table
function renderScope1Table(data) {
    const tableBody = document.getElementById('scope1_details_body');
    tableBody.innerHTML = '';

    if (!data.length) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="11">No data available for selected filters.</td>';
        tableBody.appendChild(emptyRow);
        return;
    }

    let totalCO2Kg = 0;
    let totalCH4Kg = 0;
    let totalN2OKg = 0;
    let totalCombinedKg = 0;

    data.forEach((record, index) => {
        const tr = document.createElement('tr');

        // Use emissions_kg from API response
        const co2Kg = record.emissions_kg?.co2 ?? 0;
        const ch4Kg = record.emissions_kg?.ch4 ?? 0;
        const n2oKg = record.emissions_kg?.n2o ?? 0;

        // Also get tons for display if needed
        const co2Ton = record.emissions_ton?.co2 ?? 0;
        const ch4Ton = record.emissions_ton?.ch4 ?? 0;
        const n2oTon = record.emissions_ton?.n2o ?? 0;

        const totalEmissionsKg = co2Kg + ch4Kg + n2oKg;
        const totalEmissionsTon = totalEmissionsKg / 1000;

        tr.innerHTML = `
            <td>${record.year}</td>
            <td>${record.month ?? '-'}</td>
            <td>${record.quarter ?? '-'}</td>
            <td>${capitalizeFirstLetter(record.parameter)}</td>
            <td>${capitalizeFirstLetter(record.fuel_type)}</td>
            <td>${record.total_liters.toLocaleString()}</td>
            <td>${co2Kg.toFixed(2)} kg (${co2Ton.toFixed(3)} t)</td>
            <td>${ch4Kg.toFixed(4)} kg (${ch4Ton.toFixed(4)} t)</td>
            <td>${n2oKg.toFixed(4)} kg (${n2oTon.toFixed(4)} t)</td>
            <td>${totalEmissionsKg.toFixed(2)} kg (${totalEmissionsTon.toFixed(3)} t)</td>
            <td>
                <button class="toggle-btn bg-green-500 text-white px-2 py-1 rounded text-xs" data-index="${index}">
                    Show Details
                </button>
            </td>
        `;
        tableBody.appendChild(tr);

        // Add details row with emission factors and GWP values
        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('hidden');
        detailsRow.id = `details-${index}`;
        detailsRow.innerHTML = `
            <td colspan="11">
                <div class="bg-gray-50 p-4 rounded shadow text-sm">
                    <strong>Emission Factors (EF):</strong><br>
                    CO₂: <span class="font-normal">${record.emission_factors?.co2 ?? 'N/A'}</span> |
                    CH₄: <span class="font-normal">${record.emission_factors?.ch4 ?? 'N/A'}</span> |
                    N₂O: <span class="font-normal">${record.emission_factors?.n2o ?? 'N/A'}</span><br><br>

                    <strong>Global Warming Potentials (GWP):</strong><br>
                    CO₂: <span class="font-normal">${record.gwp?.co2 ?? 'N/A'}</span> |
                    CH₄: <span class="font-normal">${record.gwp?.ch4 ?? 'N/A'}</span> |
                    N₂O: <span class="font-normal">${record.gwp?.n2o ?? 'N/A'}</span>
                </div>
            </td>
        `;
        tableBody.appendChild(detailsRow);

        // Update totals
        totalCO2Kg += co2Kg;
        totalCH4Kg += ch4Kg;
        totalN2OKg += n2oKg;
        totalCombinedKg += totalEmissionsKg;
    });

    // Append total row
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="6" class="font-semibold text-right">Total</td>
        <td class="font-semibold">${totalCO2Kg.toFixed(2)} kg</td>
        <td class="font-semibold">${totalCH4Kg.toFixed(4)} kg</td>
        <td class="font-semibold">${totalN2OKg.toFixed(4)} kg</td>
        <td class="font-semibold">${totalCombinedKg.toFixed(2)} kg</td>
        <td></td>
    `;
    tableBody.appendChild(totalRow);

    // Toggle logic for showing/hiding details rows
    document.querySelectorAll('.toggle-btn').forEach(button => {
        button.addEventListener('click', () => {
            const index = button.dataset.index;
            const detailsRow = document.getElementById(`details-${index}`);
            if (!detailsRow) return;

            const isHidden = detailsRow.classList.contains('hidden');

            document.querySelectorAll('tr[id^="details-"]').forEach(row => row.classList.add('hidden'));
            document.querySelectorAll('.toggle-btn').forEach(btn => btn.textContent = 'Show Details');

            if (isHidden) {
                detailsRow.classList.remove('hidden');
                button.textContent = 'Hide Details';
            }
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadScope1ReferenceDetails);
