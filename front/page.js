document.getElementById('reservationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Récupérer les données du formulaire
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const tableId = document.getElementById('tableId').value;
    const PlageHoraireId = document.getElementById('PlageHoraireId').value;
    const numPersonne = document.getElementById('numPersonne').value;

    // Construction de la requête
    const reservation = {
        name: name,
        phone: phone,
        date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Date actuelle au format MySQL
        numPersonne: parseInt(numPersonne, 10),
        PlageHoraireId: parseInt(PlageHoraireId, 10),
        tableId: parseInt(tableId, 10),
    };

    try {
        // Appel à l'API de réservation
        const response = await fetch('192.168.65.219:3284/reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reservation),
        });

        const result = await response.json();

        // Afficher le message de retour
        const messageDiv = document.getElementById('message');
        if (response.ok) {
            messageDiv.textContent = result.message;
            messageDiv.className = 'message success';
        } else {
            messageDiv.textContent = result.error || 'Erreur inconnue';
            messageDiv.className = 'message error';
        }
        messageDiv.style.display = 'block';
    } catch (error) {
        console.error('Erreur lors de la réservation :', error);
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Une erreur est survenue. Veuillez réessayer plus tard.';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
    }
});