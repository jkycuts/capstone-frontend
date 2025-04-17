import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    populateYearOptions();
    AnnualSummary();

    document.getElementById("generate_summary").addEventListener("click", generate);
});

function populateYearOptions() {
    const yearSelect = document.getElementById("year_select");
    const currentYear = new Date().getFullYear();

    for (let year = currentYear; year >= currentYear - 10; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.text = year;
        yearSelect.appendChild(option);
    }
}

function AnnualSummary() {
    showLoading();
    fetch(`${backendURL}/api/annual-summary/generate`, {
        method: 'GET',
        headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("API response:", data);

            if (!data || !data.data || !Array.isArray(data.data)) {
                showMessage("Invalid data format from server.", "danger");
                return;
            }

            const summaries = data.data;
            const tbody = document.getElementById("summary_body");
            tbody.innerHTML = "";

            if (summaries.length === 0) {
                showMessage("No summaries available.", "info");
            }

            summaries.forEach(summary => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${summary.year}</td>
                    <td>${summary.company_name}</td>
                    <td>${summary.annual_carbon_emission.toFixed(2)}</td>
                    <td>${summary.annual_carbon_sequestration.toFixed(2)}</td>
                    <td>${summary.carbon_neutrality_variance.toFixed(2)}</td>
                    <td>${summary.percentage_ghg_contribution.toFixed(4)}%</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching summaries:", error);
            showMessage(`Error fetching summaries: ${error.message}`, "danger");
        })
        .finally(() => hideLoading());
}

function generate() {
    const selectedYear = document.getElementById("year_select").value;

    showLoading();

    fetch(`${backendURL}/api/annual-summary/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').getAttribute("content")
        },
        body: JSON.stringify({ year: parseInt(selectedYear) })
    })
        .then(response => response.text())  // Log the raw response first for debugging
        .then(responseText => {
            console.log('Raw response:', responseText);
            try {
                const body = JSON.parse(responseText);
                return { status: response.status, body };
            } catch (e) {
                console.error('Error parsing response:', e);
                throw new Error('Failed to parse response.');
            }
        })
        .then(({ status, body }) => {
            if (status >= 200 && status < 300) {
                showMessage(body.message || "Summary generated successfully.", "success");
                fetchAnnualSummary();
            } else {
                showMessage(body.message || "Failed to generate summary.", "warning");
            }
        })
        .catch(error => {
            console.error("Generation error:", error);
            showMessage(`Failed to generate summary: ${error.message}`, "danger");
        })
        .finally(() => hideLoading());
}

function showMessage(message, type = "info") {
    const messageArea = document.getElementById("message_area");
    messageArea.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}

function showLoading() {
    const loadingIndicator = document.getElementById("loading_indicator");
    if (loadingIndicator) {
        loadingIndicator.classList.remove("d-none");  // Show loading indicator
    }
}

function hideLoading() {
    const loadingIndicator = document.getElementById("loading_indicator");
    if (loadingIndicator) {
        loadingIndicator.classList.add("d-none");  // Hide loading indicator
    }
}


