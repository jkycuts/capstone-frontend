import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector("#form_tree-growth");
    const plantationSelect = document.querySelector("#plantation_id");

    if (!form) {
        console.error("Form not found!");
        return;
    }

    // Load plantations into the dropdown
    async function loadPlantations() {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                errorNotification("Authentication token missing. Please log in.");
                return;
            }

            const response = await fetch(`${backendURL}/api/plantation`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch plantations");

            const plantations = await response.json();

            if (!plantations.length) {
                errorNotification("No plantations found. Please create one first.");
                return;
            }

            plantations.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `Plantation ${p.id} - ${p.area_planted} ha`;
                plantationSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading plantations:", error);
            errorNotification("Could not load plantation list.");
        }
    }

    loadPlantations(); // Call on DOM ready

    // Handle Tree Growth Form Submission
    form.onsubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const token = localStorage.getItem('token');

        if (!token) {
            errorNotification("No authentication token found. Please log in.", 5);
            return;
        }

        console.log("Stored token:", token); // Debugging token

        try {
            const response = await fetch(`${backendURL}/api/tree-growth`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: formData,
            });

            console.log("Response status:", response.status); // Debugging status code

            const text = await response.text();
            console.log("Raw response text:", text); // Log raw response

            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                errorNotification("Unexpected HTML response. Check if the route is correct or if you are authenticated.", 5);
                return;
            }

            if (!response.ok) {
                if (data.errors) {
                    const details = Object.values(data.errors).flat().join('<br>');
                    errorNotification(details, 5);
                } else {
                    errorNotification(data.message || "Validation failed", 5);
                }
                return;
            }

            console.log("Success:", data);
            successNotification("Tree growth data recorded successfully.", 5);
            form.reset();

        } catch (error) {
            console.error("Client Error:", error);
            errorNotification("Unexpected client error occurred. Please check console for details.", 5);
        }
    };
});
