const API_URL = "http://192.168.65.219:3030";

document.addEventListener('DOMContentLoaded', function() {
    chargerPlagesHoraires();
    document.getElementById('plageHoraireId').addEventListener('change', chargerTablesDisponibles);
    document.getElementById('reservationForm').addEventListener('submit', envoyerReservation);
});

// 🔄 Charger les plages horaires disponibles
async function chargerPlagesHoraires() {
    const selectPlageHoraire = document.getElementById("plageHoraireId");

    try {
        const response = await fetch(`${API_URL}/api/plagesHoraires`);
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        selectPlageHoraire.innerHTML = '<option value="">Sélectionnez une plage horaire</option>';

        plagesHoraires.forEach(plageHoraire => {
            const option = document.createElement("option");
            option.value = plageHoraire.id;
            option.textContent = `${plageHoraire.heure_debut} - ${plageHoraire.heure_fin}`;
            selectPlageHoraire.appendChild(option);
        });

    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
    }
}

// 🔄 Charger les tables disponibles en fonction de la date et du créneau
async function chargerTablesDisponibles() {
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const date = document.getElementById("date").value;  // 📌 On récupère la date
    const tableSelect = document.getElementById("tableId");

    if (!plageHoraireId || !date) {
        tableSelect.innerHTML = '<option value="">Sélectionnez une date et une plage horaire</option>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tables-disponibles/${plageHoraireId}/${date}`);
        if (!response.ok) throw new Error("Erreur lors du chargement des tables disponibles.");

        const tables = await response.json();
        tableSelect.innerHTML = '<option value="">Sélectionnez une table</option>';
        tables.forEach(table => {
            const option = document.createElement("option");
            option.value = table.id;
            option.textContent = "Table numéro : " + table.numero + " (Capacité : " + table.capacite + ")";
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des tables disponibles :", error);
    }
}

// 📌 Mettre à jour la liste des tables dès que la date ou la plage horaire change
document.getElementById('plageHoraireId').addEventListener('change', chargerTablesDisponibles);
document.getElementById('date').addEventListener('change', chargerTablesDisponibles);

// 📌 Envoyer la réservation
async function envoyerReservation(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const guests = document.getElementById("numPersonne").value;
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const tableId = document.getElementById("tableId").value;
    const message = document.getElementById("message");

    if (!name || !phone || !date || !guests || !plageHoraireId || !tableId) {
        message.textContent = "❌ Veuillez remplir tous les champs.";
        message.className = "message error";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reserver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, date, guests, plageHoraireId, tableId })
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