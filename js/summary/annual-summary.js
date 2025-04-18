import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById("year_select");
    const quarterSelect = document.getElementById("quarter_select"); // New dropdown for quarters
    const summaryBody = document.getElementById("summary_body");
    const messageArea = document.getElementById("message_area");

    // Populate the year dropdown from current year to 10 years back
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 10; y--) {
        const option = document.createElement("option");
        option.value = y;
        option.textContent = y;
        yearSelect.appendChild(option);
    }

    // On click: fetch annual summary data for the selected year and quarter
    document.getElementById("generate-summary").addEventListener("click", () => {
        const selectedYear = yearSelect.value;
        const selectedQuarter = quarterSelect.value;

        if (!selectedYear || !selectedQuarter) {
            messageArea.innerHTML = `<div class="alert alert-warning">Please select both year and quarter.</div>`;
            return;
        }

        // Show loading state
        messageArea.innerHTML = `<div class="alert alert-info">Loading summary for ${selectedYear} ${selectedQuarter}...</div>`;
        summaryBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading...</td></tr>`;

        // Fetch data from API for the selected year and quarter
        fetch(`${backendURL}/api/annual-summary?year=${selectedYear}&quarter=${selectedQuarter}`)
            .then(response => response.json())
            .then(data => {
                messageArea.innerHTML = ""; // Clear any messages
                summaryBody.innerHTML = "";

                if (!data || data.length === 0) {
                    summaryBody.innerHTML = `<tr><td colspan="7" class="text-center">No summary found for ${selectedYear} ${selectedQuarter}.</td></tr>`;
                    return;
                }

                // Populate table rows with aggregated data
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${data.year}</td>
                    <td>${data.quarter}</td>
                    <td>${data.company_name}</td>
                    <td>${data.total_tco2.toFixed(3)}</td>
                    <td>${data.carbon_sequestered_tco2.toFixed(3)}</td>
                    <td>${data.carbon_neutrality_variance.toFixed(3)}</td>
                    <td>${data.ghg_country_percent.toFixed(2)}%</td>
                `;
                summaryBody.appendChild(tr);
            })
            .catch(error => {
                console.error("Error fetching summary:", error);
                messageArea.innerHTML = `<div class="alert alert-danger">Failed to load annual summary. Please try again later.</div>`;
                summaryBody.innerHTML = "";
            });
    });
});


