import { backendURL, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const scopeSelector = document.getElementById("inventory-select");
    const scopeContainer = document.getElementById("scope-table-container");

    if (scopeSelector) {
        scopeSelector.addEventListener("change", async function () {
            const selectedValue = this.value;

            if (!selectedValue) return;

            try {
                // Fetch the table HTML file first
                const fetchPath = `./${selectedValue}`;
                console.log('Fetching HTML file:', fetchPath);

                const response = await fetch(fetchPath);

                if (!response.ok) {
                    throw new Error('Failed to load table content');
                }

                const html = await response.text();
                console.log('HTML Loaded:', html); // Log the full response for debugging

                // Use DOMParser to extract the content inside the <div class="table-responsive">
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const tableContent = doc.querySelector('.table-responsive');

                // Ensure the table content is found
                if (tableContent) {
                    console.log('Table Content:', tableContent);
                    scopeContainer.innerHTML = '';  // Clear any existing content
                    scopeContainer.appendChild(tableContent);  // Append the table content
                    
                    // Now fetch the actual emissions data from the backend
                    const emissionsResponse = await fetch(backendURL + '/api/ghg-emission/fuel');  // Fetch data from the API endpoint
                    const emissionsData = await emissionsResponse.json();

                    // Call function to populate the table with the data
                    populateScope1Table(emissionsData);
                } else {
                    throw new Error('Table content not found in the loaded HTML.');
                }

            } catch (err) {
                console.error('Error loading the table:', err);
                scopeContainer.innerHTML = '<div class="alert alert-danger">Failed to load the selected table. Please try again.</div>';
            }
        });
    }
});

// Function to populate the Scope 1 table with data from the API
function populateScope1Table(emissionsData) {
    const tableBody = document.getElementById('scope1_table_body');

    // Clear any existing rows
    tableBody.innerHTML = '';

    // Loop through the data and create table rows dynamically
    emissionsData.forEach(emission => {
        const row = document.createElement('tr');

        // Create and append table cells
        const paramCell = document.createElement('td');
        paramCell.textContent = emission.parameter || 'N/A'; // Assuming there's a 'parameter' field
        row.appendChild(paramCell);

        const yearCell = document.createElement('td');
        yearCell.textContent = emission.year || 'N/A'; // Assuming there's a 'year' field
        row.appendChild(yearCell);

        const emissionsCell = document.createElement('td');
        emissionsCell.textContent = emission.total_emissions_tco2 || 'N/A'; // Assuming there's a 'total_emissions_tco2' field
        row.appendChild(emissionsCell);

        // Append the row to the table body
        tableBody.appendChild(row);
    });
}
