document.addEventListener("DOMContentLoaded", function () {
    chargerReservations();
    document.getElementById("search").addEventListener("input", filtrerReservations);
    
    // Vérifier les nouvelles réservations toutes les 5 secondes pour une détection quasi-instantanée
    demarrerVerificationNouvellesReservations();
});

// Fonction utilitaire pour échapper le HTML et prévenir les XSS
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Variable pour stocker le nombre actuel de réservations
let nombreReservationsActuel = 0;

// Démarrer la vérification périodique des nouvelles réservations
function demarrerVerificationNouvellesReservations() {
    // Première vérification immédiate pour établir le nombre initial
    verifierNouvellesReservations();
    
    // Puis vérification toutes les 5 secondes pour être quasiment instantané
    setInterval(verifierNouvellesReservations, 5000);
}

// Vérifier s'il y a de nouvelles réservations
async function verifierNouvellesReservations() {
    try {
        const response = await fetch("http://192.168.65.219:3030/api/reservations", {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) throw new Error("Erreur lors de la vérification des réservations.");

        const reservations = await response.json();
        
        // Si c'est la première vérification, initialiser le compteur
        if (nombreReservationsActuel === 0) {
            nombreReservationsActuel = reservations.length;
            return;
        }
        
        // S'il y a de nouvelles réservations
        if (reservations.length > nombreReservationsActuel) {
            console.log("✨ Nouvelles réservations détectées ! Rechargement de la page...");
            // Rechargement immédiat
            location.reload();
        } else {
            // Mise à jour du compteur de réservations
            nombreReservationsActuel = reservations.length;
        }
    } catch (error) {
        console.error("❌ Erreur lors de la vérification des nouvelles réservations :", error);
    }
}

// 📌 Charger les réservations
async function chargerReservations() {
    const reservationsTable = document.getElementById("reservationsTable");
    try {
        const response = await fetch("http://192.168.65.219:3030/api/reservations", {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des réservations.");

        const reservations = await response.json();
        reservationsTable.innerHTML = ""; // On vide le tableau
        
        // Mettre à jour le compteur de réservations
        nombreReservationsActuel = reservations.length;

        reservations.forEach(reservation => {
            // Validation des données
            if (!reservation || !reservation.id) return;
            
            const row = document.createElement("tr");
            row.setAttribute("data-id", parseInt(reservation.id, 10));

            // Création sécurisée des cellules
            const nameTd = document.createElement("td");
            nameTd.className = "name";
            nameTd.textContent = reservation.name || '';
            
            const phoneTd = document.createElement("td");
            phoneTd.className = "phone";
            phoneTd.textContent = reservation.phone || '';
            
            const dateTd = document.createElement("td");
            dateTd.className = "date";
            dateTd.textContent = formatterDate(reservation.date || '');
            
            const horaireTd = document.createElement("td");
            horaireTd.className = "horaire";
            horaireTd.textContent = `${escapeHTML(reservation.heure_debut || '')} - ${escapeHTML(reservation.heure_fin || '')}`;
            
            const tableTd = document.createElement("td");
            tableTd.className = "tableId";
            tableTd.textContent = `Table ${parseInt(reservation.numero, 10) || ''}`;
            
            const personneTd = document.createElement("td");
            personneTd.className = "numPersonne";
            personneTd.textContent = parseInt(reservation.numPersonne, 10) || '';
            
            const actionsTd = document.createElement("td");
            actionsTd.className = "actions";
            
            // Bouton modifier sécurisé
            const editBtn = document.createElement("button");
            editBtn.className = "btn btn-edit";
            editBtn.onclick = function() { activerEdition(parseInt(reservation.id, 10)); };
            
            const editIcon = document.createElement("i");
            editIcon.className = "fas fa-edit";
            editBtn.appendChild(editIcon);
            editBtn.appendChild(document.createTextNode(" Modifier"));
            
            // Bouton supprimer sécurisé
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn btn-delete";
            deleteBtn.onclick = function() { supprimerReservation(parseInt(reservation.id, 10)); };
            
            const deleteIcon = document.createElement("i");
            deleteIcon.className = "fas fa-trash-alt";
            deleteBtn.appendChild(deleteIcon);
            deleteBtn.appendChild(document.createTextNode(" Supprimer"));
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            
            // Ajout des cellules à la ligne
            row.appendChild(nameTd);
            row.appendChild(phoneTd);
            row.appendChild(dateTd);
            row.appendChild(horaireTd);
            row.appendChild(tableTd);
            row.appendChild(personneTd);
            row.appendChild(actionsTd);
            
            reservationsTable.appendChild(row);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des réservations :", error);
    }
}

// 📌 Activer le mode édition
async function activerEdition(id) {
    if (!id || isNaN(id)) return;
    
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;

    // Sauvegarde du contenu original
    row.dataset.originalContent = row.innerHTML;

    const name = row.querySelector(".name").textContent;
    const phone = row.querySelector(".phone").textContent;
    const date = row.querySelector(".date").textContent;
    const numPersonne = row.querySelector(".numPersonne").textContent;
    const tableId = row.querySelector(".tableId").textContent.replace("Table ", "");

    const formattedDate = formatterDateEnvoi(date);

    // Création sécurisée des éléments de formulaire
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = `name-${id}`;
    nameInput.value = escapeHTML(name);
    row.querySelector(".name").innerHTML = '';
    row.querySelector(".name").appendChild(nameInput);

    const phoneInput = document.createElement("input");
    phoneInput.type = "text";
    phoneInput.id = `phone-${id}`;
    phoneInput.value = escapeHTML(phone);
    row.querySelector(".phone").innerHTML = '';
    row.querySelector(".phone").appendChild(phoneInput);

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = `date-${id}`;
    dateInput.value = formattedDate;
    row.querySelector(".date").innerHTML = '';
    row.querySelector(".date").appendChild(dateInput);

    const numPersonneInput = document.createElement("input");
    numPersonneInput.type = "number";
    numPersonneInput.id = `numPersonne-${id}`;
    numPersonneInput.value = parseInt(numPersonne, 10) || 1;
    row.querySelector(".numPersonne").innerHTML = '';
    row.querySelector(".numPersonne").appendChild(numPersonneInput);

    // Créer les sélecteurs
    const tableSelect = document.createElement("select");
    tableSelect.id = `tableSelect-${id}`;
    tableSelect.className = "tableSelect";
    row.querySelector(".tableId").innerHTML = '';
    row.querySelector(".tableId").appendChild(tableSelect);

    const horaireSelect = document.createElement("select");
    horaireSelect.id = `plageHoraireSelect-${id}`;
    horaireSelect.className = "plageHoraireSelect";
    row.querySelector(".horaire").innerHTML = '';
    row.querySelector(".horaire").appendChild(horaireSelect);

    await chargerTables(id, tableId);
    await chargerPlagesHoraires(id);

    // Ajout dynamique des boutons "Sauvegarder" et "Annuler" de manière sécurisée
    const actionsCell = row.querySelector(".actions");
    actionsCell.innerHTML = '';
    
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-save";
    saveBtn.onclick = function() { enregistrerReservation(id); };
    saveBtn.textContent = "✅ Sauvegarder";
    
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-cancel";
    cancelBtn.onclick = function() { annulerEdition(id); };
    cancelBtn.textContent = "❌ Annuler";
    
    actionsCell.appendChild(saveBtn);
    actionsCell.appendChild(cancelBtn);
}

// 📌 Annuler l'édition
function annulerEdition(id) {
    if (!id || isNaN(id)) return;
    
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row || !row.dataset.originalContent) return;
    
    row.innerHTML = row.dataset.originalContent; // Restaurer l'affichage original
}

// 📌 Charger les tables
async function chargerTables(reservationId, selectedTableId) {
    if (!reservationId || isNaN(reservationId)) return;
    
    try {
        const response = await fetch("http://192.168.65.219:3030/api/tables", {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des tables.");

        const tables = await response.json();
        const select = document.getElementById(`tableSelect-${reservationId}`);
        if (!select) return;
        
        select.innerHTML = '';
        
        tables.forEach(table => {
            if (!table || !table.id || !table.numero) return;
            
            const option = document.createElement("option");
            option.value = parseInt(table.id, 10);
            option.textContent = `Table ${parseInt(table.numero, 10)}`;
            
            if (parseInt(table.id, 10) === parseInt(selectedTableId, 10)) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des tables :", error);
    }
}

// 📌 Charger les plages horaires
async function chargerPlagesHoraires(reservationId) {
    if (!reservationId || isNaN(reservationId)) return;
    
    try {
        const response = await fetch("http://192.168.65.219:3030/api/plagesHoraires", {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error("Erreur lors du chargement des plages horaires.");

        const plagesHoraires = await response.json();
        const select = document.getElementById(`plageHoraireSelect-${reservationId}`);
        if (!select) return;
        
        select.innerHTML = '';
        
        plagesHoraires.forEach(plage => {
            if (!plage || !plage.id || !plage.heure_debut || !plage.heure_fin) return;
            
            const option = document.createElement("option");
            option.value = parseInt(plage.id, 10);
            option.textContent = `${escapeHTML(plage.heure_debut)} - ${escapeHTML(plage.heure_fin)}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("❌ Erreur lors du chargement des plages horaires :", error);
    }
}

// 📌 Enregistrer la réservation modifiée
async function enregistrerReservation(id) {
    if (!id || isNaN(id)) return;
    
    const nameInput = document.getElementById(`name-${id}`);
    const phoneInput = document.getElementById(`phone-${id}`);
    const dateInput = document.getElementById(`date-${id}`);
    const numPersonneInput = document.getElementById(`numPersonne-${id}`);
    const plageHoraireSelect = document.getElementById(`plageHoraireSelect-${id}`);
    const tableSelect = document.getElementById(`tableSelect-${id}`);
    
    if (!nameInput || !phoneInput || !dateInput || !numPersonneInput || !plageHoraireSelect || !tableSelect) {
        alert("🚨 Erreur: Éléments du formulaire non trouvés !");
        return;
    }

    const nouveauNom = nameInput.value.trim();
    const nouveauTel = phoneInput.value.trim();
    const nouvelleDate = dateInput.value;
    const nouveauNbPersonnes = numPersonneInput.value;
    const selectedPlageHoraire = plageHoraireSelect.value;
    const selectedTable = tableSelect.value;

    if (!nouveauNom || !nouveauTel || !nouvelleDate || !nouveauNbPersonnes || !selectedPlageHoraire || !selectedTable) {
        alert("🚨 Tous les champs sont obligatoires !");
        return;
    }

    // Validation des données
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nouvelleDate)) {
        alert("🚨 Format de date invalide !");
        return;
    }

    if (!/^\d+$/.test(nouveauNbPersonnes) || parseInt(nouveauNbPersonnes) <= 0) {
        alert("🚨 Nombre de personnes invalide !");
        return;
    }

    if (!/^\d+$/.test(selectedPlageHoraire)) {
        alert("🚨 Plage horaire invalide !");
        return;
    }

    if (!/^\d+$/.test(selectedTable)) {
        alert("🚨 Table invalide !");
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
                numPersonne: parseInt(nouveauNbPersonnes, 10),
                plageHoraireId: parseInt(selectedPlageHoraire, 10),
                tableId: parseInt(selectedTable, 10)
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Réservation mise à jour avec succès !");
            chargerReservations();
        } else {
            alert("🚨 " + (result.error || "Une erreur est survenue lors de la mise à jour."));
        }
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
        alert("🚨 Une erreur est survenue lors de la communication avec le serveur.");
    }
}

// 📌 Supprimer une réservation
async function supprimerReservation(id) {
    if (!id || isNaN(id)) return;
    
    if (!confirm("⚠️ Êtes-vous sûr de vouloir supprimer cette réservation ?")) return;

    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return;
    
    row.style.transition = "opacity 0.5s";
    row.style.opacity = 0;

    setTimeout(async () => {
        try {
            const response = await fetch(`http://192.168.65.219:3030/api/reservations/${id}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("Erreur lors de la suppression.");
            row.remove();
            alert("✅ Réservation supprimée avec succès !");
        } catch (error) {
            console.error("❌ Suppression échouée :", error);
            row.style.opacity = 1; // Restaurer l'opacité si échec
            alert("🚨 La suppression a échoué.");
        }
    }, 500);
}

// 📌 Filtrer les réservations (par nom ou téléphone)
function filtrerReservations() {
    const query = document.getElementById("search").value.toLowerCase();
    const rows = document.querySelectorAll("#reservationsTable tr");

    rows.forEach(row => {
        const nameCell = row.querySelector(".name");
        const phoneCell = row.querySelector(".phone");
        
        if (!nameCell || !phoneCell) return;
        
        const name = nameCell.textContent.toLowerCase();
        const phone = phoneCell.textContent.toLowerCase();
        row.style.display = (name.includes(query) || phone.includes(query)) ? "table-row" : "none";
    });
}

// 📌 Formatter les dates affichées en JJ/MM/YYYY
function formatterDate(dateString) {
    if (!dateString) return '';
    
    const dateObj = new Date(dateString);
    return isNaN(dateObj.getTime()) ? dateString : dateObj.toLocaleDateString("fr-FR");
}

// 📌 Formatter la date avant envoi au back (YYYY-MM-DD)
function formatterDateEnvoi(dateString) {
    if (!dateString) return '';
    
    const parts = dateString.split("/");
    if (parts.length !== 3) return dateString;
    
    const [jour, mois, annee] = parts;
    return `${annee}-${mois.padStart(2, '0')}-${jour.padStart(2, '0')}`;
}