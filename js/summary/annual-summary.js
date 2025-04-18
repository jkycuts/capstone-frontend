import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

fetch(backendURL + '/api/dashboard-summary', {
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN' // Use if protected
    }
})
.then(response => response.json())
.then(data => {
    document.getElementById('totalEmission').innerText = data.total_emission + ' TCO₂';
    document.getElementById('totalSequestration').innerText = data.total_sequestration + ' TCO₂';
    document.getElementById('carbonVariance').innerText = data.carbon_variance + ' TCO₂';
    document.getElementById('percentageContribution').innerText = data.percentage_contribution + ' %';
})
.catch(error => {
    console.error('Error fetching dashboard data:', error);
});


