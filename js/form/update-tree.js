import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    const treeId = getTreeIdFromUrl();
    const form = document.getElementById('update-tree-form');
    const dbhInput = document.getElementById('dbh-input');
    const heightInput = document.getElementById('height-input');
    const imagePreview = document.getElementById('image-preview');
    const errorAlert = document.getElementById('error-alert');

    if (!treeId) {
        errorAlert.textContent = 'Missing Tree ID in URL';
        errorAlert.classList.remove('d-none');
        return;
    }

    // Load existing tree data
    try {
        const response = await fetch(`${backendURL}/api/tree-growth/${treeId}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });

        if (!response.ok) throw new Error('Failed to fetch tree data');

        const tree = await response.json();
        dbhInput.value = tree.dbh;
        heightInput.value = tree.height;
        document.getElementById('tree-id-input').value = treeId;
        form.classList.remove('d-none');
    } catch (error) {
        console.error(error);
        errorAlert.textContent = error.message;
        errorAlert.classList.remove('d-none');
    }

    // 🔁 Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page reload

        const formData = new FormData();
        formData.append('dbh', dbhInput.value);
        formData.append('height', heightInput.value);

        try {
            const response = await fetch(`${backendURL}/api/tree-growth/${treeId}`, {
                method: 'POST', 
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update tree data');
            }

            successNotification("Tree data updated successfully.");

            // Reload the tree data after the update
            reloadTreeData(treeId);
            
        } catch (error) {
            console.error(error);
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        }
    });
});

// Extract tree_id from URL
function getTreeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('tree_id');
}
