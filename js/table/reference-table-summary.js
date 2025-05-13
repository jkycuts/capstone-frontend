const scopes = ['scope1', 'scope2', 'scope3'];

async function loadScopeDetails(scope) {
    try {
        const response = await axios.get(`/api/ghg-emission/${scope}/details`);
        const data = response.data;

        const tbody = document.querySelector(`#${scope}-reference-table tbody`);
        tbody.innerHTML = '';

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.year}</td>
                <td>${item.type}</td>
                <td>${item.total}</td>
                <td>${item.emission_factor}</td>
                <td>${item.emission_tco2e}</td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error(`Error loading ${scope} details`, error);
        alert(`Failed to load ${scope.toUpperCase()} details.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    scopes.forEach(loadScopeDetails);
});
