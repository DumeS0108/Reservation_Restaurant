document.addEventListener("DOMContentLoaded", function () {
    chargerReservations();
    document.getElementById("search").addEventListener("input", filtrerReservations);
});

// 📌 Charger les réservations
async function chargerReservations() {
    const reservationsTable = document.getElementById("reservationsTable");
    try {
        const response = await fetch("http://192.168.65.219:3030/api/reservations");
        if (!response.ok) throw new Error("Erreur lors du chargement des réservations.");

        const reservations = await response.json();
        reservationsTable.innerHTML = ""; // On vide le tableau

        reservations.forEach(reservation => {
            const row = document.createElement("tr");
            row.setAttribute("data-id", reservation.id);

            row.innerHTML = `
                <td class="name">${reservation.name}</td>
                <td class="phone">${reservation.phone}</td>
                <td class="date">${formatterDate(reservation.date)}</td>
                <td class="horaire">${reservation.heure_debut} - ${reservation.heure_fin}</td>
                <td class="tableId">Table ${reservation.numero}</td>
                <td class="numPersonne">${reservation.numPersonne}</td>
                <td class="actions">
                    <button class="btn btn-edit" onclick="activerEdition(${reservation.id})">
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

// 📌 Activer le mode édition
async function activerEdition(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);

    // Sauvegarde du contenu original
    row.dataset.originalContent = row.innerHTML;

    const name = row.querySelector(".name").textContent;
    const phone = row.querySelector(".phone").textContent;
    const date = row.querySelector(".date").textContent;
    const numPersonne = row.querySelector(".numPersonne").textContent;
    const tableId = row.querySelector(".tableId").textContent.replace("Table ", "");

    const formattedDate = formatterDateEnvoi(date);

    row.querySelector(".name").innerHTML = `<input type="text" id="name-${id}" value="${name}" />`;
    row.querySelector(".phone").innerHTML = `<input type="text" id="phone-${id}" value="${phone}" />`;
    row.querySelector(".date").innerHTML = `<input type="date" id="date-${id}" value="${formattedDate}" />`;
    row.querySelector(".numPersonne").innerHTML = `<input type="number" id="numPersonne-${id}" value="${numPersonne}" />`;

    row.querySelector(".tableId").innerHTML = `<select id="tableSelect-${id}" class="tableSelect"></select>`;
    row.querySelector(".horaire").innerHTML = `<select id="plageHoraireSelect-${id}" class="plageHoraireSelect"></select>`;

    await chargerTables(id, tableId);
    await chargerPlagesHoraires(id);

    // Ajout dynamique des boutons "Sauvegarder" et "Annuler"
    const actionsCell = row.querySelector(".actions");
    actionsCell.innerHTML = `
        <button class="btn btn-save" onclick="enregistrerReservation(${id})">
            ✅ Sauvegarder
        </button>
        <button class="btn btn-cancel" onclick="annulerEdition(${id})">
            ❌ Annuler
        </button>
    `;
}

// 📌 Annuler l'édition
function annulerEdition(id) {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    row.innerHTML = row.dataset.originalContent; // Restaurer l'affichage original
}

// 📌 Charger les tables
async function chargerTables(reservationId, selectedTableId) {
    try {
        const response = await fetch("http://192.168.65.219:3030/api/tables");
        if (!response.ok) throw new Error("Erreur lors du chargement des tables.");

        const tables = await response.json();
        const select = document.getElementById(`tableSelect-${reservationId}`);

        select.innerHTML = tables.map(table => 
            `<option value="${table.id}" ${table.id == selectedTableId ? "selected" : ""}>Table ${table.numero}</option>`
        ).join('');
    } catch (error) {
        console.error("❌ Erreur lors du chargement des tables :", error);
    }
}

// 📌 Charger les plages horaires
async function chargerPlagesHoraires(reservationId) {
    try {
        const response = await fetch("http://192.168.65.219:3030/api/plagesHoraires");
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        const select = document.getElementById(`plageHoraireSelect-${reservationId}`);

        select.innerHTML = plagesHoraires.map(plage => 
            `<option value="${plage.id}">${plage.heure_debut} - ${plage.heure_fin}</option>`
        ).join('');
    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
    }
}

// 📌 Enregistrer la réservation modifiée
async function enregistrerReservation(id) {
    const nouveauNom = document.getElementById(`name-${id}`).value;
    const nouveauTel = document.getElementById(`phone-${id}`).value;
    const nouvelleDate = document.getElementById(`date-${id}`).value;
    const nouveauNbPersonnes = document.getElementById(`numPersonne-${id}`).value;
    const selectedPlageHoraire = document.getElementById(`plageHoraireSelect-${id}`).value;
    const selectedTable = document.getElementById(`tableSelect-${id}`).value;

    if (!nouveauNom || !nouveauTel || !nouvelleDate || !nouveauNbPersonnes || !selectedPlageHoraire || !selectedTable) {
        alert("🚨 Tous les champs sont obligatoires !");
        return;
    }

    try {
        const response = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nouveauNom,
                phone: nouveauTel,
                date: nouvelleDate,
                numPersonne: nouveauNbPersonnes,
                plageHoraireId: selectedPlageHoraire,
                tableId: selectedTable
            })
        });

        if (!response.ok) throw new Error("Erreur lors de la mise à jour de la réservation.");

        alert("✅ Réservation mise à jour avec succès !");
        chargerReservations();
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
    }
}

// 📌 Supprimer une réservation
async function supprimerReservation(id) {
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer cette réservation ?")) return;

    const row = document.querySelector(`tr[data-id="${id}"]`);
    row.style.transition = "opacity 0.5s";
    row.style.opacity = 0;

    setTimeout(async () => {
        try {
            const response = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression.");
            row.remove();
            alert("✅ Réservation supprimée avec succès !");
        } catch (error) {
            console.error("❌ Suppression échouée :", error);
            alert("🚨 La suppression a échoué.");
        }
    }, 500);
}

// 📌 Filtrer les réservations (par nom ou téléphone)
function filtrerReservations() {
    const query = document.getElementById("search").value.toLowerCase();
    const rows = document.querySelectorAll("#reservationsTable tr");

    rows.forEach(row => {
        const name = row.querySelector(".name").textContent.toLowerCase();
        const phone = row.querySelector(".phone").textContent.toLowerCase();
        row.style.display = (name.includes(query) || phone.includes(query)) ? "table-row" : "none";
    });
}

// 📌 Formatter les dates affichées en JJ/MM/YYYY
function formatterDate(dateString) {
    const dateObj = new Date(dateString);
    return isNaN(dateObj) ? dateString : dateObj.toLocaleDateString("fr-FR");
}

// 📌 Formatter la date avant envoi au back (YYYY-MM-DD)
function formatterDateEnvoi(dateString) {
    const [jour, mois, annee] = dateString.split("/");
    return `${annee}-${mois}-${jour}`;
}
