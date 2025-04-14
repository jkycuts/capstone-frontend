import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const plantationSelect = document.getElementById('plantation-select');
    const sequestrationData = document.getElementById('sequestration-data');
    const totalSequestration = document.getElementById('total-sequestration');
    const treeTableBody = document.getElementById('tree-table-body');
    const updateButton = document.getElementById('update-tree-btn'); // Update button

    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        errorNotification('Please log in to access this data.');
        return;
    }

    // Load plantations for dropdown
    async function loadPlantations() {
        try {
            const response = await fetch(`${backendURL}/api/plantation`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const plantations = await response.json();
            plantations.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `Plantation ${p.id} - ${p.area_planted} ha`;
                plantationSelect.appendChild(option);
            });
        } catch (error) {
            errorNotification("Failed to load plantations.");
            console.error("Load Plantations Error:", error);
        }
    }

    // Fetch sequestration data when plantation is selected
    plantationSelect.addEventListener('change', async () => {
        const plantationId = plantationSelect.value;
        if (!plantationId) return;

        try {
            treeTableBody.innerHTML = `<tr><td colspan="9" class="text-center">Loading...</td></tr>`;

            const response = await fetch(`${backendURL}/api/carbon-sequestration/${plantationId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            console.log("Sequestration Data:", data);

            if (data.error) {
                sequestrationData.classList.add('d-none');
                return errorNotification(data.error);
            }

            if (!data.tree_sequestration_details || data.tree_sequestration_details.length === 0) {
                treeTableBody.innerHTML = `<tr><td colspan="9" class="text-center">No tree data available.</td></tr>`;
                sequestrationData.classList.remove('d-none');
                totalSequestration.textContent = "0";
                return;
            }

            totalSequestration.textContent = data.total_carbon_sequestration_kg;
            treeTableBody.innerHTML = '';

            data.tree_sequestration_details.forEach(tree => {
                const row = `
                    <tr>
                        <td>${tree.tree_id}</td>
                        <td>${tree.dbh}</td>
                        <td>${tree.height}</td>
                        <td>${tree.AGB_kg}</td>
                        <td>${tree.BGB_kg}</td>
                        <td>${tree.total_biomass_kg}</td>
                        <td>${tree.carbon_content_kg}</td>
                        <td>${tree.CO2_sequestration_kg}</td>
                        <td><button class="btn btn-warning btn-sm update-tree-btn" data-tree-id="${tree.tree_id}">Update</button></td>
                    </tr>
                `;
                treeTableBody.insertAdjacentHTML('beforeend', row);
            });

            sequestrationData.classList.remove('d-none');
        } catch (error) {
            errorNotification("Failed to fetch sequestration data.");
            console.error("Fetch Sequestration Error:", error);
        }
    });

    // Handle Update Button Click
    treeTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('update-tree-btn')) {
            const treeId = event.target.getAttribute('data-tree-id');
            updateTreeData(treeId); // Call function to pre-fill and allow updating
        }
    });

    function updateTreeData(treeId) {
        // Pre-fill the form for the selected tree
        const treeRow = document.querySelector(`[data-tree-id="${treeId}"]`).closest('tr');
        const dbh = treeRow.querySelector('td:nth-child(2)').textContent;
        const height = treeRow.querySelector('td:nth-child(3)').textContent;
        const agb = treeRow.querySelector('td:nth-child(4)').textContent;

        // Example: Show the "Update Tree Data" button and pre-fill a form with current tree values
        document.getElementById('dbh-input').value = dbh;
        document.getElementById('height-input').value = height;
        document.getElementById('agb-input').value = agb;

        // Show the form or update button for the user to make changes
        document.getElementById('update-tree-btn').style.display = 'block';
        alert(`Update data for Tree ID: ${treeId}`);
    }

    // Load plantations on page load
    loadPlantations();
});
