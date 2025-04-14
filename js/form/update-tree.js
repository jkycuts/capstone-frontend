
import { backendURL, errorNotification, successNotification } from '../utils/utils.js';


document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const treeId = urlParams.get('tree_id');

    const form = document.getElementById('update-tree-form');
    const dbhInput = document.getElementById('dbh');
    const heightInput = document.getElementById('height');
    const treeIdInput = document.getElementById('tree_id'); // ✅ match input id in HTML

    if (!treeId) {
        alert("Missing tree ID in URL.");
        return;
    }

    treeIdInput.value = treeId;

    // 1. Load current tree data
    try {
        const res = await fetch(`${backendURL}/api/tree-growth/${treeId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });

        const contentType = res.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            const errorText = await res.text();
            console.error("Unexpected response body:", errorText);
            throw new Error("Server did not return JSON.");
        }

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Server response:", errorText);
            throw new Error("Failed to fetch tree data.");
        }

        const tree = await res.json();
        dbhInput.value = tree.dbh;
        heightInput.value = tree.height;
    } catch (error) {
        errorNotification("Could not load tree data.");
        console.error(error);
    }

    // 2. Submit updated tree data
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const dbhValue = parseFloat(dbhInput.value);
        const heightValue = parseFloat(heightInput.value);

        // Debugging: Log the values to ensure they are being correctly parsed
        console.log("DBH Value:", dbhValue);
        console.log("Height Value:", heightValue);

        if (isNaN(dbhValue) || isNaN(heightValue)) {
            errorNotification("Both DBH and Height fields must have valid values.");
            return;
        }

        const updatedData = {
            dbh: dbhValue,
            height: heightValue
        };

        try {
            const res = await fetch(`${backendURL}/api/tree-growth/${treeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error("Server response:", errorText);
                throw new Error("Update failed");
            }

            successNotification("Tree data updated successfully!");

            // Update the table row with new data
            updateTableRow(treeId, updatedData);

            // Also update the carbon sequestration table with the new data
            updateCarbonSequestrationTable(treeId, updatedData);

        } catch (err) {
            errorNotification("Update failed.");
            console.error(err);
        }
    });
});

// Function to update the tree growth table row dynamically
function updateTableRow(treeId, updatedData) {
    const row = document.querySelector(`#tree-row-${treeId}`);  // Assuming each row has an ID like `tree-row-1`
    
    if (row) {
        // Find the DBH and Height cells in the row and update them
        const dbhCell = row.querySelector('.tree-db');  // Assuming the DBH column has the class `tree-db`
        const heightCell = row.querySelector('.tree-height');  // Assuming the Height column has the class `tree-height`

        if (dbhCell && heightCell) {
            dbhCell.textContent = updatedData.dbh;  // Update DBH value
            heightCell.textContent = updatedData.height;  // Update Height value
        }
    }
}

// Function to update the carbon sequestration table dynamically
function updateCarbonSequestrationTable(treeId, updatedData) {
    const row = document.querySelector(`#carbon-sequestration-row-${treeId}`);  // Assuming each row has an ID like `carbon-sequestration-row-1`

    if (row) {
        // Find the DBH and Height cells in the row and update them
        const dbhCell = row.querySelector('.carbon-seq-db');  // Assuming the DBH column has the class `carbon-seq-db`
        const heightCell = row.querySelector('.carbon-seq-height');  // Assuming the Height column has the class `carbon-seq-height`
        const carbonSequestrationCell = row.querySelector('.carbon-seq');  // Assuming carbon sequestration data column has class `carbon-seq`

        if (dbhCell && heightCell && carbonSequestrationCell) {
            dbhCell.textContent = updatedData.dbh;  // Update DBH value
            heightCell.textContent = updatedData.height;  // Update Height value

            // Calculate and update the carbon sequestration value
            const carbonSequestration = calculateCarbonSequestration(updatedData.dbh, updatedData.height);
            carbonSequestrationCell.textContent = carbonSequestration.toFixed(2);  // Update Carbon Sequestration value
        }
    }
}

// Calculates carbon sequestration from DBH and height using simplified formula
function calculateCarbonSequestration(dbh, height) {
    // Sample: AGB = 34.4703 - 8.0671 * DBH + 0.6589 * DBH^2
    const AGB = 34.4703 - (8.0671 * dbh) + (0.6589 * Math.pow(dbh, 2));
    const BGB = AGB * 0.15;
    const totalBiomass = AGB + BGB;
    const carbonContent = totalBiomass * 0.5;
    const CO2Sequestration = carbonContent * 3.67;
    return CO2Sequestration;
}
