const API_URL = "http://192.168.65.219:3030";

document.addEventListener('DOMContentLoaded', function() {
    chargerPlagesHoraires();
    document.getElementById('plageHoraireId').addEventListener('change', chargerTablesDisponibles);
});

// 🔄 Charger les plages horaires disponibles
async function chargerPlagesHoraires() {
    const selectPlageHoraire = document.getElementById("plageHoraireId");
    const tableSelect = document.getElementById("tableId");
    try {
        const response = await fetch(`${API_URL}/api/plagesHoraires`);
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        plagesHoraires.forEach(plageHoraire => {
            const option = document.createElement("option");
            option.value = plageHoraire.id;
            option.textContent =  plageHoraire.heure_debut +' '+ plageHoraire.heure_fin ;
            selectPlageHoraire.appendChild(option);
        });

        // Mettre à jour le select tableId avec les plages horaires
        tableSelect.innerHTML = '<option value="">Sélectionnez une plage horaire d\'abord</option>';
        plagesHoraires.forEach(plageHoraire => {
            const option = document.createElement("option");
            option.value = plageHoraire.id;
            option.textContent = plageHoraire.nom;
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
    }
}

// 🔄 Charger les tables disponibles selon la plage horaire
async function chargerTablesDisponibles() {
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const tableSelect = document.getElementById("tableId");
    try {
        const response = await fetch(`${API_URL}/api/tables?plageHoraireId=${plageHoraireId}`);
        if (!response.ok) throw new Error("Erreur lors du chargement des tables disponibles.");

        const tables = await response.json();
        tableSelect.innerHTML = '<option value="">Sélectionnez une table</option>';
        tables.forEach(table => {
            const option = document.createElement("option");
            option.value = table.id;
            option.textContent ="table numero : " + table.numero +' capacité '+ table.capacite;
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des tables disponibles :", error);
    }
}

// 📌 Envoyer la réservation
async function envoyerReservation(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const numPersonne = document.getElementById("numPersonne").value;
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const tableId = document.getElementById("tableId").value;
    const message = document.getElementById("message");

    if (!name || !phone || !date || !numPersonne || !plageHoraireId || !tableId) {
        message.textContent = "❌ Veuillez remplir tous les champs.";
        message.className = "message error";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reserver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, date, guests: numPersonne, plageHoraireId, tableId })
        });

        const result = await response.json();

        if (response.ok) {
            message.textContent = "✅ Réservation réussie !";
            message.className = "message success";
            document.getElementById("reservationForm").reset();
        } else {
            message.textContent = "❌ " + result.error;
            message.className = "message error";
        }
    } catch (error) {
        console.error("❌ Erreur lors de la réservation :", error);
        message.textContent = "❌ Une erreur est survenue.";
        message.className = "message error";
    }
}
