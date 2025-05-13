import { backendURL, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", function () {
  loadKPIs();
  loadTrendCharts();
  loadCompanyTable();

  document.getElementById("companySearch").addEventListener("input", loadCompanyTable);
  document.getElementById("industryFilter").addEventListener("change", loadCompanyTable);
});

async function loadKPIs() {
  try {
    const response = await axios.get("/api/admin/summary");
    const data = response.data;

    document.getElementById("total-emissions").innerText = `${data.total_emissions} TCO₂`;
    document.getElementById("total-sequestration").innerText = `${data.total_sequestration} TCO₂`;
    document.getElementById("net-variance").innerText = `${data.net_variance} TCO₂`;
    document.getElementById("national-contribution").innerText = `${data.national_ghg_percent}%`;
  } catch (error) {
    console.error("Failed to load KPI data", error);
  }
}

async function loadTrendCharts() {
  try {
    const response = await axios.get("/api/admin/trends");
    const { emissions, sequestration, years } = response.data;

    new Chart(document.getElementById("emissionsChart"), {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: "GHG Emissions",
          data: emissions,
          borderColor: "red",
          fill: false,
        }],
      },
    });

    new Chart(document.getElementById("sequestrationChart"), {
      type: "line",
      data: {
        labels: years,
        datasets: [{
          label: "Carbon Sequestration",
          data: sequestration,
          borderColor: "green",
          fill: false,
        }],
      },
    });
  } catch (error) {
    console.error("Failed to load trend data", error);
  }
}

async function loadCompanyTable() {
  const search = document.getElementById("companySearch").value;
  const industry = document.getElementById("industryFilter").value;

  try {
    const response = await axios.get("/api/admin/companies", {
      params: { search, industry },
    });

    const tbody = document.getElementById("companyTableBody");
    tbody.innerHTML = "";

    response.data.forEach((c) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td class="border p-2">${c.name}</td>
        <td class="border p-2">${c.industry}</td>
        <td class="border p-2">${c.year}</td>
        <td class="border p-2">${c.emission} TCO₂</td>
        <td class="border p-2">${c.sequestration} TCO₂</td>
        <td class="border p-2">${c.variance > 0 ? "+" : ""}${c.variance} TCO₂</td>
        <td class="border p-2">${c.variance > 0 ? "🔴 High Emission" : "✅ Carbon Negative"}</td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Failed to load companies", error);
  }
}
