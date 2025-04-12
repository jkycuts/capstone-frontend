async function fetchTreeMarkers() {
    const response = await fetch(backendURL + "/api/tree-growth", {
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
        },
    });

    if (response.ok) {
        const trees = await response.json();
        trees.forEach(tree => {
            L.marker([tree.latitude, tree.longitude]).addTo(map)
              .bindPopup(`<strong>Species:</strong> ${tree.species}<br><strong>Planted Year:</strong> ${tree.planted_year}`);
        });
    } else {
        const json = await response.json();
        errorNotification(json.message, 10);
    }
}
