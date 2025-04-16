import { backendURL, errorNotification, successNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", async () => {
    const treeId = getTreeIdFromUrl();
    const form = document.getElementById('update-tree-form');
    const dbhInput = document.getElementById('dbh-input');
    const heightInput = document.getElementById('height-input');
    const imageInput = document.getElementById('geotag-photos-input');
    const imagePreview = document.getElementById('image-preview');
    const errorAlert = document.getElementById('error-alert');

    if (!treeId) {
        errorAlert.textContent = 'Missing Tree ID in URL';
        errorAlert.classList.remove('d-none');
        return;
    }

    await reloadTreeData(treeId);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('dbh', dbhInput.value);
        formData.append('height', heightInput.value);

        if (imageInput && imageInput.files.length > 0) {
            formData.append('geotag_photos', imageInput.files[0]);
        }

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
            await reloadTreeData(treeId);

            // Redirect after successful update
            setTimeout(() => {
                window.location.href = "/carbon-seq.html"; // Modify as needed
            }, 3000);

        } catch (error) {
            console.error(error);
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        }
    });
});

async function reloadTreeData(treeId) {
    const dbhInput = document.getElementById('dbh-input');
    const heightInput = document.getElementById('height-input');
    const imagePreview = document.getElementById('image-preview');
    const form = document.getElementById('update-tree-form');
    const errorAlert = document.getElementById('error-alert');

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

        if (tree.geotag_photos) {
            imagePreview.src = `${backendURL}/storage/${tree.geotag_photos}`;
            imagePreview.classList.remove('d-none');
        } else {
            imagePreview.classList.add('d-none');
        }


        form.classList.remove('d-none');
    } catch (error) {
        console.error(error);
        errorAlert.textContent = error.message;
        errorAlert.classList.remove('d-none');
    }
}


function getTreeIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('tree_id');
}
