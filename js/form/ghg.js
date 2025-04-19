import { backendURL, successNotification, errorNotification } from '../utils/utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const form_ghg_emission = document.getElementById("form_ghg_emission");
    if (!form_ghg_emission) {
        console.warn("form_ghg_emission not found");
        return;
    }

    const submitBtn = form_ghg_emission.querySelector("button[type=submit]");

    form_ghg_emission.onsubmit = async function (e) {
        e.preventDefault();

        const year = document.getElementById("year").value;
        const quarter = document.getElementById("quarter").value;
        const fuel_source = document.getElementById("fuel_source").value;
        const fuel_type = document.getElementById("fuel_type").value;
        const fuel_liters_used = document.getElementById("fuel_liters_used").value;
        const electricity_kwh = document.getElementById("electricity_kwh").value;
        const travel_category = document.getElementById("travel_category").value;
        const travel_distance_miles = document.getElementById("travel_distance_miles").value;
        const date_recorded = document.getElementById("date_recorded").value;

        // Basic required fields check
        if (!year || !quarter || !fuel_source || !fuel_type || !fuel_liters_used ||
            !electricity_kwh || !travel_category || !travel_distance_miles) {
            errorNotification("Please fill in all required fields.", 5);
            return;
        }

        // Parse and validate numeric values
        const parsedFuelLiters = parseFloat(fuel_liters_used);
        const parsedElectricityKwh = parseFloat(electricity_kwh);
        const parsedTravelDistance = parseFloat(travel_distance_miles);

        if (isNaN(parsedFuelLiters) || isNaN(parsedElectricityKwh) || isNaN(parsedTravelDistance)) {
            errorNotification("Please ensure all numerical fields are valid.", 5);
            return;
        }

        // Date validation
        const parsedDateRecorded = new Date(date_recorded);
        if (isNaN(parsedDateRecorded.getTime())) {
            errorNotification("Invalid date format for the date recorded.", 5);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                errorNotification("No authentication token found. Please log in.", 5);
                return;
            }

            submitBtn.disabled = true;

            // Define emission factors for each fuel type
            const emissionFactors = {
                'diesel': { 'co2': 2.712681, 'ch4': 0.000143, 'n2o': 0.000143 },
                'biodiesel': { 'co2': 0.0, 'ch4': 0.000382, 'n2o': 0.000872 },
                'ethanol': { 'co2': 0.0, 'ch4': 0.0001, 'n2o': 0.0001 },
                'gasoline': { 'co2': 2.297040, 'ch4': 0.000671, 'n2o': 0.000210 }
            };

            // Retrieve the emission factors for the selected fuel type
            const fuelEmissionsFactor = emissionFactors[fuel_type];
            if (!fuelEmissionsFactor) {
                errorNotification("Invalid fuel type selected.", 5);
                return;
            }

            // Calculate emissions for fuel consumption (in CO2e)
            const fuelEmissions = parsedFuelLiters * fuelEmissionsFactor.co2 +
                                  parsedFuelLiters * fuelEmissionsFactor.ch4 +
                                  parsedFuelLiters * fuelEmissionsFactor.n2o;

            // Calculate electricity emissions (in CO2e)
            const electricityMWh = parsedElectricityKwh / 1000; // Convert kWh to MWh
            const electricityEmissionFactor = 0.496; // Emission factor for electricity in CO2e per MWh
            const electricityEmissions = electricityMWh * electricityEmissionFactor;

            // Calculate business travel emissions (in CO2e)
            const travelEmissionFactors = {
                'co2': 0.277, // CO2 per mile
                'ch4': 0.0000104, // CH4 per mile
                'n2o': 0.0000085 // N2O per mile
            };
            const activityData = parsedTravelDistance; // Total distance traveled in miles
            const travelCo2 = activityData * travelEmissionFactors.co2;
            const travelCh4 = activityData * travelEmissionFactors.ch4;
            const travelN2o = activityData * travelEmissionFactors.n2o;
            const totalTravelEmissionsKg = travelCo2 + travelCh4 + travelN2o;
            const totalTravelEmissions = totalTravelEmissionsKg / 1000; // Convert kg to metric tons

            // Calculate total emissions for the period
            const totalEmissions = fuelEmissions + electricityEmissions + totalTravelEmissions;

            const response = await fetch(`${backendURL}/api/ghg-emission`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    year: parseInt(year),
                    quarter,
                    fuel_source,
                    fuel_type,
                    fuel_liters_used: parsedFuelLiters,
                    electricity_kwh: parsedElectricityKwh,
                    travel_category,
                    travel_distance_miles: parsedTravelDistance,
                    total_emissions: totalEmissions,
                    date_recorded,
                })
            });

            if (!response.ok) {
                const errorJson = await response.json();
                console.error("Validation Error:", errorJson);

                if (errorJson.errors) {
                    const details = Object.values(errorJson.errors).flat().join('<br>');
                    errorNotification(details, 5);
                } else {
                    errorNotification(errorJson.message || "Validation failed", 5);
                }

                return;
            }

            const data = await response.json();
            console.log("Success:", data);

            const emissions = data.emissions;
            successNotification(
                `GHG emission recorded successfully.<br>
                <b>Total Emission:</b> ${(emissions.total_tco2 ?? 0).toFixed(3)} TCO₂<br>
                <b>Fuel:</b> ${(emissions.fuel_tco2 ?? 0).toFixed(3)}<br>
                <b>Electricity:</b> ${(emissions.electricity_tco2 ?? 0).toFixed(3)}<br>
                <b>Travel:</b> ${(emissions.business_travel_tco2 ?? 0).toFixed(3)}`,
                5
            );
            

            form_ghg_emission.reset();

            setTimeout(() => {
                window.location.href = "/ghg-emission-table.html";
            }, 3000);

        } catch (error) {
            console.error("Client Error:", error);
            errorNotification("Unexpected client error occurred. Please check console for details.", 5);
        } finally {
            submitBtn.disabled = false;
        }
    };
});
