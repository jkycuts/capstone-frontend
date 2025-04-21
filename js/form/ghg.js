import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    if (!token) {
        errorNotification("No authentication token found. Please log in.", 5);
        return;
    }

    // Scope selector logic
    const scopeSelector = document.getElementById("scopeSelector");
    if (scopeSelector) {
        scopeSelector.addEventListener("change", function () {
            const selectedValue = this.value;
            if (selectedValue) {
                window.location.href = selectedValue;
            }
        });
    }

    // Handle Scope 1: Fuel Consumption
    const formFuel = document.getElementById("form_scope1_fuel");
    if (formFuel) {
        formFuel.onsubmit = async function (e) {
            e.preventDefault();
            const year = +document.getElementById("fuel_year").value;
            const quarter = document.getElementById("fuel_quarter").value;
            const fuel_source = document.getElementById("fuel_source").value;
            const fuel_type = document.getElementById("fuel_type").value;
            const fuel_liters_used = parseFloat(document.getElementById("fuel_liters_used").value);
            const date_recorded = document.getElementById("fuel_date_recorded").value;

            if (!year || !quarter || !fuel_source || !fuel_type || isNaN(fuel_liters_used)) {
                errorNotification("Fill in all required fields.", 5);
                return;
            }

            const factors = {
                diesel: { co2: 2.712681, ch4: 0.000143, n2o: 0.000143 },
                biodiesel: { co2: 0.0, ch4: 0.000382, n2o: 0.000872 },
                ethanol: { co2: 0.0, ch4: 0.0001, n2o: 0.0001 },
                gasoline: { co2: 2.297040, ch4: 0.000671, n2o: 0.000210 },
            };

            const ef = factors[fuel_type];
            if (!ef) {
                errorNotification("Invalid fuel type.", 5);
                return;
            }

            const fuelEmissions = fuel_liters_used * (ef.co2 + ef.ch4 + ef.n2o);

            try {
                const res = await fetch(`${backendURL}/api/ghg-emission/fuel`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        year,
                        quarter,
                        fuel_source,
                        fuel_type,
                        fuel_liters_used,
                        total_emissions: fuelEmissions,
                        date_recorded
                    })
                });

                const data = await res.json();
                if (!res.ok) throw data;

                successNotification(`Fuel emission recorded. <b>${fuelEmissions.toFixed(3)}</b> TCO₂`, 5);
                formFuel.reset();
                setTimeout(() => window.location.href = "/ghg-emission-table.html", 3000);
            } catch (err) {
                console.error("Fuel Scope Error:", err);
                errorNotification(err.message || "Failed to submit fuel emission", 5);
            }
        };
    }

    // Handle Scope 2: Electricity
    const formElectricity = document.getElementById("form_scope2_electricity");
    if (formElectricity) {
        formElectricity.onsubmit = async function (e) {
            e.preventDefault();

            const year = +document.getElementById("elec_year").value;
            const quarter = document.getElementById("elec_quarter").value;
            const electricity_kwh = parseFloat(document.getElementById("electricity_kwh").value);
            const date_recorded = document.getElementById("elec_date_recorded").value;

            if (!year || !quarter || isNaN(electricity_kwh)) {
                errorNotification("Fill in all required fields.", 5);
                return;
            }

            const mwh = electricity_kwh / 1000;
            const factor = 0.496;
            const electricityEmissions = mwh * factor;

            try {
                const res = await fetch(`${backendURL}/api/ghg-emission/electricity`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        year,
                        quarter,
                        electricity_kwh,
                        total_emissions: electricityEmissions,
                        date_recorded
                    })
                });

                const data = await res.json();
                if (!res.ok) throw data;

                successNotification(`Electricity emission recorded. <b>${electricityEmissions.toFixed(3)}</b> TCO₂`, 5);
                formElectricity.reset();
                setTimeout(() => window.location.href = "/ghg-emission-table.html", 3000);
            } catch (err) {
                console.error("Electricity Scope Error:", err);
                errorNotification(err.message || "Failed to submit electricity emission", 5);
            }
        };
    }

    // Handle Scope 3: Business Travel
    const formTravel = document.getElementById("form_scope3_travel");
    if (formTravel) {
        formTravel.onsubmit = async function (e) {
            e.preventDefault();

            const year = +document.getElementById("travel_year").value;
            const quarter = document.getElementById("travel_quarter").value;
            const travel_category = document.getElementById("travel_category").value;
            const distance = parseFloat(document.getElementById("travel_distance_miles").value);
            const date_recorded = document.getElementById("travel_date_recorded").value;

            if (!year || !quarter || !travel_category || isNaN(distance)) {
                errorNotification("Fill in all required fields.", 5);
                return;
            }

            const factors = { co2: 0.277, ch4: 0.0000104, n2o: 0.0000085 };
            const kg = distance * (factors.co2 + factors.ch4 + factors.n2o);
            const travelEmissions = kg / 1000;

            try {
                const res = await fetch(`${backendURL}/api/ghg-emission/travel`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        year,
                        quarter,
                        travel_category,
                        travel_distance_miles: distance,
                        total_emissions: travelEmissions,
                        date_recorded
                    })
                });

                const data = await res.json();
                if (!res.ok) throw data;

                successNotification(`Travel emission recorded. <b>${travelEmissions.toFixed(3)}</b> TCO₂`, 5);
                formTravel.reset();
                setTimeout(() => window.location.href = "/ghg-emission-table.html", 3000);
            } catch (err) {
                console.error("Travel Scope Error:", err);
                errorNotification(err.message || "Failed to submit travel emission", 5);
            }
        };
    }
});
