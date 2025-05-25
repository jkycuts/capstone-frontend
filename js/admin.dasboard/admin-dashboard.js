import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

let ghgChart;

document.addEventListener("DOMContentLoaded", () => {
  fetchYears();

  const userPageBtn = document.getElementById("goToUserPage");
  if (userPageBtn) {
    userPageBtn.addEventListener("click", () => window.location.href = "/user-page");
  }

  const companySearchInput = document.getElementById("companySearch");
  if (companySearchInput) {
    companySearchInput.addEventListener("input", filterTable);
  }
});

// Fetch available years for the dropdown
async function fetchYears() {
  try {
    const response = await fetch(`${backendURL}/api/admin/years`);
    if (!response.ok) throw new Error("Failed to fetch years");

    const years = await response.json();
    const yearSelect = document.getElementById("yearSelect");
    if (!yearSelect) return;

    yearSelect.innerHTML = ""; // clear loading

    years.forEach(({ year }) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    if (years.length > 0) {
      yearSelect.value = years[0].year;
      fetchGHGSummary(years[0].year);
    }

    yearSelect.addEventListener("change", (e) => {
      fetchGHGSummary(e.target.value);
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
    updateGHGChart(data);

  } catch (err) {
    console.error(err);
    showError("Failed to load GHG summary.");
  }
}

// Render GHG summary in table
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
    tr.classList.add("cursor-pointer", "hover:bg-gray-100");
    tr.dataset.companyId = item.company_id; // Add company ID for fetching details
    tr.dataset.year = item.year;

    tr.innerHTML = `
      <td class="p-2 border company-name">${item.company_name}</td>
      <td class="p-2 border">${item.year}</td>
      <td class="p-2 border">${item.total_emissions.toFixed(2)} TCO₂</td>
      <td class="p-2 border">${item.total_sequestration.toFixed(2)} TCO₂</td>
      <td class="p-2 border">${item.net_variance.toFixed(2)} TCO₂</td>
      <td class="p-2 border font-semibold">${getStatusBadge(item.status)}</td>
    `;
    tr.addEventListener("click", () => showCompanyDetails(item.company_id, item.year));
    tbody.appendChild(tr);
  });

  filterTable();
}

// Show detailed info for a specific company and year
function showCompanyDetails(companyId, year) {
  document.getElementById('companyDetailsModal').classList.remove('hidden');

  fetch(`${backendURL}/api/admin/company-details/${companyId}/${year}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const emissions = parseFloat(data.total_emissions) || 0;
      const sequestration = parseFloat(data.total_sequestration) || 0;
      const netVariance = parseFloat(data.net_variance) || 0;

      // Set basic info
      document.getElementById('modalCompanyName').textContent = data.company_name || 'N/A';
      document.getElementById('modalLocation').textContent = data.location || 'N/A';
      document.getElementById('modalYear').textContent = data.year || 'N/A';
      document.getElementById('modalEmissions').textContent = emissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('modalSequestration').textContent = sequestration.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('modalNetVariance').textContent = netVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // Status and message
      const statusEl = document.getElementById('modalStatus');
const messageBox = document.getElementById('modalMessageBox');
const messageIcon = document.getElementById('modalMessageIcon');
const messageText = document.getElementById('modalMessageText');

// Reset all styles
statusEl.className = 'font-semibold';
messageBox.classList.remove('bg-green-50', 'bg-gray-50', 'bg-red-50', 'border-green-300', 'border-gray-300', 'border-red-300');
messageText.classList.remove('text-green-700', 'text-gray-700', 'text-red-700');
messageIcon.className = 'w-4 h-4 mt-1 rounded-full flex-shrink-0';

// Show box
messageBox.classList.remove('hidden');

if (sequestration > emissions) {
  statusEl.textContent = "Carbon Positive";
  statusEl.classList.add('text-green-700');

  messageBox.classList.add('bg-green-50', 'border-green-300');
  messageText.classList.add('text-green-700');
  messageIcon.classList.add('bg-green-500');
  messageText.textContent = "The company has done a great job — its carbon sequestration exceeds its emissions. job! Carbon sequestration exceeds the emissions.";
} else if (sequestration === emissions) {
  statusEl.textContent = "Carbon Neutral";
  statusEl.classList.add('text-gray-700');

  messageBox.classList.add('bg-gray-50', 'border-gray-300');
  messageText.classList.add('text-gray-700');
  messageIcon.classList.add('bg-gray-500');
  messageText.textContent = "The company is in balance. Emissions are fully offset by its carbon sequestration efforts.";
} else {
  statusEl.textContent = "Carbon Negative";
  statusEl.classList.add('text-red-700');

  messageBox.classList.add('bg-red-50', 'border-red-300');
  messageText.classList.add('text-red-700');
  messageIcon.classList.add('bg-red-500');
  messageText.textContent = "The company needs to enhance its tree planting efforts to offset its carbon emissions.";
}

    })
    .catch(error => {
      console.error('Error fetching company details:', error);
      alert('Failed to load company details.');
      closeCompanyModal();
    });

    function closeCompanyModal() {
  document.getElementById('companyDetailsModal').classList.add('hidden');
}
window.closeCompanyModal = closeCompanyModal; // make global if needed
}



// Render KPI cards
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

// Utility to safely set text
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Update or create GHG emissions chart
function updateGHGChart(data) {
  const canvas = document.getElementById("ghgChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const labels = data.map(item => item.company_name);
  const emissionsData = data.map(item => item.total_emissions);

  if (!ghgChart) {
    ghgChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "GHG Emissions (TCO₂)",
          data: emissionsData,
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "TCO₂"
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                return `${tooltipItem.label}: ${tooltipItem.raw.toFixed(2)} TCO₂`;
              }
            }
          }
        }
      }
    });
  } else {
    ghgChart.data.labels = labels;
    ghgChart.data.datasets[0].data = emissionsData;
    ghgChart.update();
  }
}

// Table filter
function filterTable() {
  const input = document.getElementById("companySearch");
  const rows = document.querySelectorAll("#company-table-body tr");

  if (!input) return;

  const search = input.value.toLowerCase();

  rows.forEach((row) => {
    const company = row.querySelector(".company-name")?.textContent.toLowerCase() || "";
    row.style.display = company.includes(search) ? "" : "none";
  });
}

// Display error alert
function showError(msg) {
  const alertBox = document.querySelector(".alert-danger");
  if (!alertBox) return;

  alertBox.textContent = msg;
  alertBox.classList.remove("d-none");
  setTimeout(() => alertBox.classList.add("d-none"), 4000);
}

// Tailwind-style badge for status
function getStatusBadge(status) {
  let base = "inline-block px-2 py-1 rounded-full text-xs font-medium ";
  switch (status) {
    case "Carbon Positive":
      return `<span class="${base}bg-green-100 text-green-800">${status}</span>`;
    case "Carbon Neutral":
      return `<span class="${base}bg-gray-100 text-gray-800">${status}</span>`;
    case "Carbon Negative":
      return `<span class="${base}bg-red-100 text-red-800">${status}</span>`;
    default:
      return `<span class="${base}bg-yellow-100 text-yellow-800">${status}</span>`;
  }
}
