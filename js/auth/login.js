import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

/* Form Login */
const form_login = document.getElementById("form_login");

form_login.onsubmit = async (e) => {
    e.preventDefault();

    // Disable Button
    document.querySelector("#form_login button").disabled = true;
    document.querySelector("#form_login button").innerHTML = 
    `<div class="spinner-border me-2" role="status"></div> 
    <span>Loading...</span>` ;

    // Get values of form (input, textarea, select) set it as form data
    const formData = new FormData(form_login);

    // Fetch User API user register endpoint
    const response = await fetch(backendURL + "/api/login", {
        method: "POST",
        headers: {
            Accept: "application/json",
        },
        body: formData,
    });

    // Get response if 200-299 status code
    if (response.ok) {
        const json = await response.json();
        console.log(json);

        localStorage.setItem("token", json.token)

        form_login.reset();

        successNotification("Successfully Login Account!");

        /* Redirect Page */
        window.location.href = "/index.html";

    // Get response if 422 status code
    } else if (response.status == 422) {
        const json = await response.json();

        errorNotification(json.message, 5);
    }

    // Enable Button
    document.querySelector("#form_login button").disabled = false;
    document.querySelector("#form_login button").innerHTML = `Login`;
};