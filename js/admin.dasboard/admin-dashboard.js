import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

let ghgChart; // Declare chart globally to update it later

document.addEventListener("DOMContentLoaded", () => {
  fetchYears();

  const userPageBtn = document.getElementById("goToUserPage");
  if (userPageBtn) {
    userPageBtn.addEventListener("click", function () {
      window.location.href = "/user-page";
    });
  }

  const companySearchInput = document.getElementById("companySearch");
  if (companySearchInput) {
    companySearchInput.addEventListener("input", () => {
      filterTable();
    });
  }
});

// Fetch available years for the dropdown
async function fetchYears() {
  try {
    const response = await fetch(backendURL + "/api/admin/years");
    if (!response.ok) throw new Error("Failed to fetch years");

    const years = await response.json();
    const yearSelect = document.getElementById("yearSelect");

    if (!yearSelect) return;

    yearSelect.innerHTML = ""; // clear loading option

    years.forEach(({ year }) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    // Auto-load first year
    if (years.length > 0) {
      yearSelect.value = years[0].year;
      fetchGHGSummary(years[0].year);
    }

    yearSelect.addEventListener("change", (e) => {
      const selectedYear = e.target.value;
      fetchGHGSummary(selectedYear);
    });

  } catch (err) {
    console.error(err);
    showError("Unable to load years.");
  }
}

// Fetch GHG Summary from backend for selected year
async function fetchGHGSummary(year) {
  try {
    const response = await fetch(`${backendURL}/api/admin/ghg-summary?year=${year}`);
    if (!response.ok) throw new Error("Failed to fetch data");

    const data = await response.json();

    renderTable(data);
    renderKPIs(data);
    updateGHGChart(data); // Update chart with new data

  } catch (err) {
    console.error(err);
    showError("Failed to load GHG summary.");
  }
}

// Render summary table rows
function renderTable(data) {
  const tbody = document.getElementById("company-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">No data available.</td></tr>`;
    return;
  }

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="p-2 border company-name">${item.company_name}</td>
      <td class="p-2 border">${item.year}</td>
      <td class="p-2 border">${item.total_emissions.toFixed(2)} TCO₂</td>
      <td class="p-2 border">${item.total_sequestration.toFixed(2)} TCO₂</td>
      <td class="p-2 border">${item.net_variance.toFixed(2)} TCO₂</td>
      <td class="p-2 border font-bold" style="color:${item.status_color}">${item.status}</td>
    `;
    tbody.appendChild(tr);
  });

  filterTable(); // apply search filter if any
}

// Render KPI summary values (aggregated)
function renderKPIs(data) {
  const totalEmissions = data.reduce((sum, item) => sum + item.total_emissions, 0);
  const totalSequestration = data.reduce((sum, item) => sum + item.total_sequestration, 0);
  const netVariance = totalSequestration - totalEmissions;
  const nationalContribution = totalEmissions > 0 ? ((totalEmissions / 139500000) * 100).toFixed(4) : 0;

  safeSetText("total_emissions", `${totalEmissions.toFixed(2)} TCO₂`);
  safeSetText("total_sequestration", `${totalSequestration.toFixed(2)} TCO₂`);
  safeSetText("net_variance", `${netVariance.toFixed(2)} TCO₂`);
  safeSetText("national_contribution_percent", `${nationalContribution}%`);
}

// Safe way to set text content only if the element exists
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Update the GHG Chart
function updateGHGChart(data) {
  const canvas = document.getElementById("ghgChart");
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const years = data.map(item => item.year);
  const emissionsData = data.map(item => item.total_emissions);

  if (!ghgChart) {
    // Create the chart if it doesn't exist
    ghgChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: years,
        datasets: [{
          label: 'GHG Emissions (TCO₂)',
          data: emissionsData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 50
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.raw} TCO₂`;
              }
            }
          }
        }
      }
    });
  } else {
    // Update existing chart
    ghgChart.data.labels = years;
    ghgChart.data.datasets[0].data = emissionsData;
    ghgChart.update();
  }
}

// Filter company table by name
function filterTable() {
  const input = document.getElementById("companySearch");
  if (!input) return;

  const searchValue = input.value.toLowerCase();
  const rows = document.querySelectorAll("#company-table-body tr");

  rows.forEach((row) => {
    const company = row.querySelector(".company-name")?.textContent.toLowerCase() || "";
    row.style.display = company.includes(searchValue) ? "" : "none";
  });
}

// Show error message in alert box
function showError(msg) {
  const alertBox = document.querySelector(".alert-danger");
  if (!alertBox) return;

  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
  setTimeout(() => alertBox.classList.add("d-none"), 4000);
}
