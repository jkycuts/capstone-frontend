import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const plantationSelect = document.getElementById('plantation-select');
    const sequestrationData = document.getElementById('sequestration-data');
    const totalSequestration = document.getElementById('total-sequestration');
    const treeTableBody = document.getElementById('tree-table-body');

    // Load plantation options into the select dropdown
    async function loadPlantations() {
        try {
            const response = await fetch(`${backendURL}/api/plantation`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            const text = await response.text();
            console.log("Raw response from /plantation:", text);

            const plantations = JSON.parse(text);

            if (!plantations.length) {
                errorNotification("No plantations found. Please add some.");
                return;
            }

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

    plantationSelect.addEventListener('change', async () => {
        const plantationId = plantationSelect.value;
        if (!plantationId) return;

        try {
            // Display loading message while fetching data
            treeTableBody.innerHTML = `<tr><td colspan="10" class="text-center">Loading...</td></tr>`;

            const response = await fetch(`${backendURL}/api/carbon-sequestration/${plantationId}?t=${Date.now()}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
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
                treeTableBody.innerHTML = `<tr><td colspan="10" class="text-center">No tree data available.</td></tr>`;
                sequestrationData.classList.remove('d-none');
                totalSequestration.textContent = "0";
                return;
            }

            // Update the total sequestration value
            totalSequestration.textContent = data.total_carbon_sequestration_kg;

            // Clear the table before inserting new rows
            treeTableBody.innerHTML = '';

            data.tree_sequestration_details.forEach(tree => {
                const CO2_sequestration_in_ton = (tree.CO2_sequestration_kg / 1000).toFixed(2); // Convert to tons

                // Create a new row with the tree data
                const row = `
                    <tr>
                        <td>${tree.tree_id}</td>
                        <td>${tree.species}</td>
                        <td>${tree.dbh}</td>
                        <td>${tree.height}</td>
                        <td>${tree.AGB_kg}</td>
                        <td>${tree.BGB_kg}</td>
                        <td>${tree.total_biomass_kg}</td>
                        <td>${tree.carbon_content_kg}</td>
                        <td>${tree.CO2_sequestration_kg}</td>
                        <td>${CO2_sequestration_in_ton}</td>
                        <td>
                            <a class="btn btn-outline-success" href="update-tree-data.html?tree_id=${tree.tree_id}" role="button">
                                Update
                            </a>
                        </td>
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

    loadPlantations();
});
