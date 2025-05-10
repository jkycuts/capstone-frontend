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
        fuelTypeFilter.innerHTML = `<option value="">All</option>` + fuelTypes.map(ft => `<option value="${ft}">${capitalizeFirstLetter(ft)}</option>`).join('');

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
        tableBody.innerHTML = '<p>No data available for selected filters.</p>';
        return;
    }

    let totalCO2 = 0;
    let totalCH4 = 0;
    let totalN2O = 0;
    let totalCombined = 0;

    data.forEach(record => {
        const container = document.createElement('div');
        container.classList.add('overflow-x-auto', 'border', 'rounded-lg', 'shadow-sm', 'p-4', 'mb-4');

        const heading = document.createElement('h2');
        heading.classList.add('text-base', 'font-semibold', 'mb-2');
        heading.textContent = `${capitalizeFirstLetter(record.parameter)} — ${record.fuel_type}`;

        const table = document.createElement('table');
        table.classList.add('table-auto', 'w-full', 'text-sm', 'text-left');

        const rows = [
            ['Year', record.year],
            ['Parameter', capitalizeFirstLetter(record.parameter)],
            ['Fuel Type', record.fuel_type],
            ['Total Liters', record.total_liters],
            ['CO₂ (t)', record.emissions.co2.toFixed(2)],
            ['CH₄ (t)', record.emissions.ch4.toFixed(2)],
            ['N₂O (t)', record.emissions.n2o.toFixed(2)],
            ['EF CO₂', record.emission_factors.co2],
            ['EF CH₄', record.emission_factors.ch4],
            ['EF N₂O', record.emission_factors.n2o],
            ['GWP CO₂', record.gwp.co2],
            ['GWP CH₄', record.gwp.ch4],
            ['GWP N₂O', record.gwp.n2o],
        ];

        rows.forEach(([label, value]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <th class="bg-gray-100 px-4 py-2 font-medium w-1/3">${label}</th>
                <td class="px-4 py-2">${value}</td>
            `;
            table.appendChild(tr);
        });

        container.appendChild(heading);
        container.appendChild(table);
        tableBody.appendChild(container);

        // Accumulate the emissions for the total calculations
        totalCO2 += record.emissions.co2;
        totalCH4 += record.emissions.ch4;
        totalN2O += record.emissions.n2o;
        totalCombined += record.emissions.co2 + record.emissions.ch4 + record.emissions.n2o;
    });

    // Add a row for total emissions for the selected year
    const totalRow = document.createElement('div');
    totalRow.classList.add('overflow-x-auto', 'border', 'rounded-lg', 'shadow-sm', 'p-4', 'mb-4');

    const totalHeading = document.createElement('h2');
    totalHeading.classList.add('text-base', 'font-semibold', 'mb-2');
    totalHeading.textContent = `Total Emissions for ${data[0].year}`;

    const totalTable = document.createElement('table');
    totalTable.classList.add('table-auto', 'w-full', 'text-sm', 'text-left');

    const totalRows = [
        ['Total CO₂ (t)', totalCO2.toFixed(2)],
        ['Total CH₄ (t)', totalCH4.toFixed(2)],
        ['Total N₂O (t)', totalN2O.toFixed(2)],
        ['Total Emissions (t)', totalCombined.toFixed(2)],  // Total combined emissions
    ];

    totalRows.forEach(([label, value]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <th class="bg-gray-100 px-4 py-2 font-medium w-1/3">${label}</th>
            <td class="px-4 py-2">${value}</td>
        `;
        totalTable.appendChild(tr);
    });

    totalRow.appendChild(totalHeading);
    totalRow.appendChild(totalTable);
    tableBody.appendChild(totalRow);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadScope1ReferenceDetails);
