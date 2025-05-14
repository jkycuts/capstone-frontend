async function loadCompanyProfile(companyId) {
  try {
    const res = await axios.get(`/api/admin/company/${companyId}`);
    const data = res.data;

    document.getElementById('company-profile').classList.remove('hidden');
    document.getElementById('company-name').textContent = data.company.name;
    document.getElementById('company-industry').textContent = data.company.industry;

    document.getElementById('kpi-emission').textContent = `${data.summary.total_emission} TCO₂`;
    document.getElementById('kpi-sequestration').textContent = `${data.summary.total_sequestration} TCO₂`;
    document.getElementById('kpi-variance').textContent = `${data.summary.variance} TCO₂`;
    document.getElementById('kpi-percent').textContent = `${data.summary.percent_country_contribution ?? '—'}%`;

    // Emission Breakdown
    document.getElementById('emission-breakdown').textContent = JSON.stringify(data.emissions, null, 2);

    // Sequestration Info
    document.getElementById('area-planted').textContent = data.sequestration.total_area;
    document.getElementById('tree-count').textContent = data.sequestration.total_trees;
    document.getElementById('tree-age').textContent = data.sequestration.average_age;

    // Line Chart for Trends
    renderEmissionTrendChart(data.trends);

  } catch (err) {
    console.error("Failed to load company profile", err);
    alert("Error loading company profile.");
  }
}

function renderEmissionTrendChart(trends) {
  const ctx = document.getElementById('emissionTrendChart').getContext('2d');
  const years = trends.map(row => row.year);
  const emissions = trends.map(row => row.total_emission);
  const sequestration = trends.map(row => row.total_sequestration);

  if (window.emissionChart) window.emissionChart.destroy(); // Destroy old chart

  window.emissionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Emissions (TCO₂)',
          data: emissions,
          borderColor: '#EF4444',
          fill: false
        },
        {
          label: 'Sequestration (TCO₂)',
          data: sequestration,
          borderColor: '#10B981',
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}
