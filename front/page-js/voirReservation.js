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
                <td>
                    <button class="btn btn-edit" onclick="modifierReservation(${reservation.id}, '${reservation.name}', '${reservation.phone}', '${reservation.date}', ${reservation.numPersonne})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-delete" onclick="supprimerReservation(${reservation.id})">
                        <i class="fas fa-trash-alt"></i> Supprimer
                    </button>
                </td>
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

async function supprimerReservation(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) return;

    try {
        const response = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression de la réservation.");

        alert("✅ Réservation supprimée avec succès !");
        chargerReservations();
    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error);
    }
}

async function modifierReservation(id, name, phone, date, numPersonne, plageHoraireId) {
    const nouveauNom = prompt("Nom :", name);
    const nouveauTel = prompt("Téléphone :", phone);
    const nouvelleDate = prompt("Date (YYYY-MM-DD) :", date);
    const nouveauNbPersonnes = prompt("Nombre de personnes :", numPersonne);

    if (!nouveauNom || !nouveauTel || !nouvelleDate || !nouveauNbPersonnes) {
        alert("🚨 Tous les champs sont requis.");
        return;
    }

    // Reformater la date pour qu'elle soit au format 'YYYY-MM-DD'
    const formattedDate = new Date(nouvelleDate).toISOString().split('T')[0];  // 'YYYY-MM-DD'
    console.log("format de la date  :", formattedDate);


    // Récupérer la plage horaire sélectionnée dans le select
    const plageHoraireSelect = document.getElementById("plageHoraireSelect");
    const selectedPlageHoraireId = plageHoraireSelect.value;

    if (!selectedPlageHoraireId) {
        alert("🚨 Vous devez sélectionner une plage horaire.");
        return;
    }

    try {
        const response = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: nouveauNom,
                phone: nouveauTel,
                date: formattedDate,  // Utiliser la date formatée
                numPersonne: nouveauNbPersonnes,
                plageHoraireId: selectedPlageHoraireId,  // Passer l'ID de la plage horaire sélectionnée
                tableId: 1  // Assurez-vous de passer la table correcte ou demandez à l'utilisateur de la sélectionner
            })
        });

        if (!response.ok) throw new Error("Erreur lors de la mise à jour de la réservation.");

        alert("✅ Réservation mise à jour avec succès !");
        chargerReservations(); // Recharge la liste des réservations après la mise à jour
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
    }
}

