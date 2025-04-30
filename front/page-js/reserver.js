const API_URL = "http://192.168.65.219:3030";

document.addEventListener('DOMContentLoaded', function() {
    chargerPlagesHoraires();
    document.getElementById('plageHoraireId').addEventListener('change', chargerTablesDisponibles);
    document.getElementById('reservationForm').addEventListener('submit', envoyerReservation);
});

// Fonction utilitaire pour échapper le HTML et prévenir les XSS
function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 🔄 Charger les plages horaires disponibles
async function chargerPlagesHoraires() {
    const selectPlageHoraire = document.getElementById("plageHoraireId");

    try {
        const response = await fetch(`${API_URL}/api/plagesHoraires`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        selectPlageHoraire.innerHTML = '<option value="">Sélectionnez une plage horaire</option>';

        plagesHoraires.forEach(plageHoraire => {
            const option = document.createElement("option");
            // Validation des données
            const id = parseInt(plageHoraire.id, 10);
            if (isNaN(id)) return;
            
            option.value = id;
            // Échapper les valeurs pour éviter les XSS
            const heureDebut = escapeHTML(plageHoraire.heure_debut || '');
            const heureFin = escapeHTML(plageHoraire.heure_fin || '');
            option.textContent = `${heureDebut} - ${heureFin}`;
            
            selectPlageHoraire.appendChild(option);
        });

    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
        afficherMessage("Erreur lors du chargement des plages horaires.", "error");
    }
}

// 🔄 Charger les tables disponibles en fonction de la date et du créneau
async function chargerTablesDisponibles() {
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const date = document.getElementById("date").value;
    const tableSelect = document.getElementById("tableId");

    if (!plageHoraireId || !date) {
        tableSelect.innerHTML = '<option value="">Sélectionnez une date et une plage horaire</option>';
        return;
    }

    // Validation des données
    if (!/^\d+$/.test(plageHoraireId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        afficherMessage("Format de date ou plage horaire invalide", "error");
        return;
    }

    try {
        const encodedDate = encodeURIComponent(date);
        const response = await fetch(`${API_URL}/tables-disponibles/${plageHoraireId}/${encodedDate}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des tables disponibles.");

        const tables = await response.json();
        tableSelect.innerHTML = '<option value="">Sélectionnez une table</option>';
        
        tables.forEach(table => {
            const option = document.createElement("option");
            
            // Validation des données
            const id = parseInt(table.id, 10);
            const numero = parseInt(table.numero, 10);
            const capacite = parseInt(table.capacite, 10);
            
            if (isNaN(id) || isNaN(numero) || isNaN(capacite)) return;
            
            option.value = id;
            option.textContent = `Table numéro : ${numero} (Capacité : ${capacite})`;
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des tables disponibles :", error);
        afficherMessage("Erreur lors du chargement des tables disponibles.", "error");
    }
}

// Mettre à jour la liste des tables dès que la date ou la plage horaire change
document.getElementById('plageHoraireId').addEventListener('change', chargerTablesDisponibles);
document.getElementById('date').addEventListener('change', chargerTablesDisponibles);

// Fonction pour afficher les messages d'erreur/succès de manière sécurisée
function afficherMessage(texte, type) {
    const message = document.getElementById("message");
    message.textContent = type === "error" ? `❌ ${texte}` : `✅ ${texte}`;
    message.className = `message ${type}`;
}

// 📌 Envoyer la réservation
async function envoyerReservation(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const guests = document.getElementById("numPersonne").value;
    const plageHoraireId = document.getElementById("plageHoraireId").value;
    const tableId = document.getElementById("tableId").value;

    // Validation côté client
    if (!name || !phone || !date || !guests || !plageHoraireId || !tableId) {
        afficherMessage("Veuillez remplir tous les champs.", "error");
        return;
    }

    // Validation supplémentaire
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        afficherMessage("Format de date invalide", "error");
        return;
    }

    if (!/^\d+$/.test(guests) || parseInt(guests) <= 0) {
        afficherMessage("Nombre de personnes invalide", "error");
        return;
    }

    if (!/^\d+$/.test(plageHoraireId)) {
        afficherMessage("Plage horaire invalide", "error");
        return;
    }

    if (!/^\d+$/.test(tableId)) {
        afficherMessage("Table invalide", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reserver`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                name: name,
                phone: phone,
                date: date,
                guests: parseInt(guests, 10),
                plageHoraireId: parseInt(plageHoraireId, 10),
                tableId: parseInt(tableId, 10)
            })
        });

        const result = await response.json();

        if (response.ok) {
            afficherMessage("Réservation réussie !", "success");
            document.getElementById("reservationForm").reset();
        } else {
            const errorMessage = result.error ? escapeHTML(result.error) : "Une erreur est survenue";
            afficherMessage(errorMessage, "error");
        }
    } catch (error) {
        console.error("❌ Erreur lors de la réservation :", error);
        afficherMessage("Une erreur est survenue lors de la communication avec le serveur.", "error");
    }
}