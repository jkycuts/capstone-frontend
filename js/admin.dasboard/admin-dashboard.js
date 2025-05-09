import { backendURL, successNotification, errorNotification } from "../utils/utils.js";

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${backendURL}/api/superadmin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    
      const role = data.user.role;
    
      // 👇 Correct role-based redirect
      if (role === 'superadmin') {
        window.location.href = '/admin.html';
      }  else {
        window.location.href = '/index.html';
      }
    
      successNotification("Login successful");
    }
     else {
      errorNotification(data.message || "Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error(error);
    errorNotification("An error occurred during login.");
  }
});
