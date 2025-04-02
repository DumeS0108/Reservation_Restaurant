document.addEventListener("DOMContentLoaded", function () {
    chargerReservations();
    chargerPlagesHoraires(); // Charger les plages horaires dès le début
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
                <td>${formatterDate(reservation.date)}</td>
                <td>${reservation.heure_debut} - ${reservation.heure_fin}</td>
                <td>Table ${reservation.numero}</td>
                <td>${reservation.numPersonne}</td>
                <td>
                    <button class="btn btn-edit" onclick="modifierReservation(${reservation.id}, '${reservation.name}', '${reservation.phone}', '${reservation.date}', ${reservation.numPersonne}, ${reservation.plageHoraireId})">
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

async function chargerPlagesHoraires() {
    try {
        const response = await fetch("http://192.168.65.219:3030/api/plagesHoraires");
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        const select = document.getElementById("plageHoraireSelect");

        if (!select) return; // Si le select n'existe pas, on arrête

        select.innerHTML = '<option value="">Sélectionnez une plage horaire</option>';
        plagesHoraires.forEach(plage => {
            select.innerHTML += `<option value="${plage.id}">${plage.heure_debut} - ${plage.heure_fin}</option>`;
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
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
    const nouvellePlageHoraire = prompt("Plage horaire :", plageHoraireId);
    const nouvelleDate = prompt("Date (JJ-MM-YYYY) :", formatterDate(date));
    const nouveauNbPersonnes = prompt("Nombre de personnes :", numPersonne);

    if (!nouveauNom || !nouveauTel || !nouvellePlageHoraire || !nouvelleDate || !nouveauNbPersonnes) {
        alert("🚨 Tous les champs sont obligatoires !");
        return;
        console.log("🚨 Tous les champs sont obligatoires !");
    }

    // 🔄 Reformater la date pour l'envoi au back (YYYY-MM-DD)
    const formattedDate = formatterDateEnvoi(nouvelleDate);

    // 📌 Charger les plages horaires et demander à l'utilisateur de choisir
    try {
        const response = await fetch("http://192.168.65.219:3030/api/plagesHoraires");
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        let options = plagesHoraires.map(plage => `${plage.id}: ${plage.heure_debut} - ${plage.heure_fin}`).join("\n");

        // ❓ Demande à l'utilisateur de choisir une plage horaire
        let selectedPlageHoraire = prompt(`Sélectionnez une plage horaire :\n${options}`, plageHoraireId);

        if (!selectedPlageHoraire || isNaN(selectedPlageHoraire)) {
            alert("🚨 Vous devez entrer un ID de plage horaire valide.");
            return;
        }

        // 🔄 Envoi des nouvelles informations au back-end
        const updateResponse = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nouveauNom,
                phone: nouveauTel,
                date: formattedDate,
                numPersonne: nouveauNbPersonnes,
                plageHoraireId: selectedPlageHoraire, // 🔥 Utilisation de l'ID sélectionné
                tableId: 1 // ❗ Adapter en fonction du projet
            })
        });

        if (!updateResponse.ok) throw new Error("Erreur lors de la mise à jour de la réservation.");

        alert("✅ Réservation mise à jour avec succès !");
        chargerReservations();
    } catch (error) {
        console.error("❌ Erreur :", error);
    }
}


// 🔄 Fonction pour formater la date affichée en JJ-MM-YYYY
function formatterDate(dateString) {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return dateString; // Si la date est invalide, on la laisse telle quelle
    return dateObj.toLocaleDateString("fr-FR"); // Format français JJ/MM/AAAA
}

// 🔄 Fonction pour formater la date avant envoi au back (YYYY-MM-DD)
function formatterDateEnvoi(dateString) {
    const [jour, mois, annee] = dateString.split("-");
    return `${annee}-${mois}-${jour}`;
}
