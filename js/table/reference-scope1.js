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
            tableBody.innerHTML = '<p>No reference data available.</p>';
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
        tableBody.innerHTML = '<tr><td colspan="9">No data available for selected filters.</td></tr>';
        return;
    }

    let totalCO2 = 0;
    let totalCH4 = 0;
    let totalN2O = 0;
    let totalCombined = 0;

    data.forEach((record, index) => {
        const tr = document.createElement('tr');

        const co2Kg = record.emissions.co2 * 1000;
        const ch4Kg = record.emissions.ch4 * 1000;
        const n2oKg = record.emissions.n2o * 1000;
        const totalEmissionsTCO2e = record.emissions.co2 + record.emissions.ch4 + record.emissions.n2o;

        // Main row for the emission summary
        tr.innerHTML = `
            <td>${record.year}</td>
            <td>${capitalizeFirstLetter(record.parameter)}</td>
            <td>${capitalizeFirstLetter(record.fuel_type)}</td>
            <td>${record.total_liters.toLocaleString()}</td>
            <td>${co2Kg.toFixed(2)}</td>
            <td>${ch4Kg.toFixed(2)}</td>
            <td>${n2oKg.toFixed(2)}</td>
            <td>${totalEmissionsTCO2e.toFixed(2)}</td>
            <td>
                <button class="toggle-btn bg-green-500 text-white px-2 py-1 rounded text-xs" data-index="${index}">
                    Show Details
                </button>
            </td>
        `;
        
        // Add the row to the table
        tableBody.appendChild(tr);

        // Add details row for emission factors and GWP
        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('hidden');
        detailsRow.id = `details-${index}`;
       detailsRow.innerHTML = `
    <td colspan="9">
        <div class="bg-gray-50 p-4 rounded shadow text-sm">
            <strong>Emission Factors:</strong><br>
            CO₂: <span class="font-normal">${record.emission_factors.co2}</span> |
            CH₄: <span class="font-normal">${record.emission_factors.ch4}</span> |
            N₂O: <span class="font-normal">${record.emission_factors.n2o}</span><br><br>

            <strong>Global Warming Potentials (GWP):</strong><br>
            CO₂: <span class="font-normal">${record.gwp.co2}</span> |
            CH₄: <span class="font-normal">${record.gwp.ch4}</span> |
            N₂O: <span class="font-normal">${record.gwp.n2o}</span>
        </div>
    </td>
`;

        tableBody.appendChild(detailsRow);

        // Update the totals
        totalCO2 += co2Kg;
        totalCH4 += ch4Kg;
        totalN2O += n2oKg;
        totalCombined += totalEmissionsTCO2e;
    });

    // Add total row at the end of the table
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="4" class="font-semibold text-right">Total</td>
        <td class="font-semibold">${totalCO2.toFixed(2)}</td>
        <td class="font-semibold">${totalCH4.toFixed(2)}</td>
        <td class="font-semibold">${totalN2O.toFixed(2)}</td>
        <td class="font-semibold">${totalCombined.toFixed(2)}</td>
        <td></td>
    `;
    tableBody.appendChild(totalRow);

    // Toggle details row visibility
   document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
        const index = button.dataset.index;
        const detailsRow = document.getElementById(`details-${index}`);
        if (!detailsRow) return;

        const isHidden = detailsRow.classList.contains('hidden');

        // Hide all detail rows and reset button texts
        document.querySelectorAll('tr[id^="details-"]').forEach(row => row.classList.add('hidden'));
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.textContent = 'Show Details');

        // Toggle the selected one only if it was previously hidden
        if (isHidden) {
            detailsRow.classList.remove('hidden');
            button.textContent = 'Hide Details';
        }
    });
});


}


// Initialize on page load
document.addEventListener('DOMContentLoaded', loadScope1ReferenceDetails);
