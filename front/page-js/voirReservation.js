document.addEventListener("DOMContentLoaded", function () {
    chargerReservations();
    document.getElementById("search").addEventListener("input", filtrerReservations);
});

async function chargerReservations() {
    const reservationsTable = document.getElementById("reservationsTable");

    try {
        const response = await fetch("http://192.168.65.219:3030/api/reservations");
        if (!response.ok) throw new Error("Erreur lors du chargement des réservations.");

        const reservations = await response.json();
        reservationsTable.innerHTML = ""; // Vider le tableau avant d'ajouter les nouvelles données

        reservations.forEach(reservation => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${reservation.name}</td>
                <td>${reservation.phone}</td>
                <td>${reservation.date}</td>
                <td>${reservation.heure_debut} - ${reservation.heure_fin}</td>
                <td>Table ${reservation.numero}</td>
                <td>${reservation.numPersonne}</td>
            `;

            reservationsTable.appendChild(row);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des réservations :", error);
    }
}

function filtrerReservations() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const rows = document.querySelectorAll("#reservationsTable tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchValue) ? "" : "none";
    });
}
