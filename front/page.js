async function loadTables() {
    const plageHoraireId = document.getElementById('PlageHoraireId').value;

    if (!plageHoraireId) return;

    try {
        const response = await fetch(`http://192.168.65.219:3000/tables-disponibles/${plageHoraireId}`);
        const data = await response.json();

        console.log("🔍 Réponse brute du serveur:", data); // Debugging

        if (!Array.isArray(data)) {
            console.error("❌ Erreur: Le serveur n'a pas renvoyé un tableau.");
            return;
        }

        const tableSelect = document.getElementById('tableId');
        tableSelect.innerHTML = '<option value="">Sélectionnez une table</option>';

        if (data.length === 0) {
            tableSelect.innerHTML = '<option disabled>Aucune table disponible</option>';
            return;
        }

        data.forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = `Table ${table.numero} (Capacité: ${table.capacité})`;
            tableSelect.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Erreur lors du chargement des tables:', error);
    }
}

async function reserver() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const date = document.getElementById('date').value;
    const numPersonne = document.getElementById('numPersonne').value;
    const plageHoraireId = document.getElementById('PlageHoraireId').value;
    const tableId = document.getElementById('tableId').value;

    if (!name || !phone || !date || !numPersonne || !plageHoraireId || !tableId) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    try {
        const response = await fetch('http://192.168.65.219:3000/reserver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, date, numPersonne, plageHoraireId, tableId })
        });

        const result = await response.json();
        
        if (response.ok) {
            alert('Réservation réussie !');
            loadTables(); // Rafraîchir la liste des tables disponibles
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Erreur lors de la réservation:', error);
        alert("Erreur lors de la réservation.");
    }
}
