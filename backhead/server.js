const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;
const HOST = '192.168.65.219'; 

app.use(cors());
app.use(express.json());

const bddConnection = mysql.createPool({
    host: '192.168.65.219', 
    user: 'site1',
    password: 'Site1234!',
    database: 'Restaurant',
});

// 📌 Route pour récupérer les tables disponibles
app.get('/tables-disponibles/:plageHoraireId', async (req, res) => {
    const plageHoraireId = req.params.plageHoraireId;

    try {
        console.log(`🔍 Recherche des tables disponibles pour PlageHoraireId = ${plageHoraireId}`);

        const [rows] = await bddConnection.execute(
            "SELECT * FROM `table` WHERE id NOT IN (SELECT tableId FROM Reservation WHERE PlageHoraireId = ?)",
            [plageHoraireId]
        );

        console.log("✅ Tables disponibles :", rows);
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: error.message }); // 🔴 Renvoie l'erreur exacte
    }
});

// 📌 Route pour effectuer une réservation
app.post('/reserver', async (req, res) => {
    const { name, phone, date, numPersonne, plageHoraireId, tableId } = req.body;

    try {
        // Vérifier si la table est déjà réservée
        const [exist] = await bddConnection.query(
            "SELECT * FROM Reservation WHERE tableId = ? AND PlageHoraireId = ?",
            [tableId, plageHoraireId]
        );

        if (exist.length > 0) {
            return res.status(400).json({ error: 'Cette table est déjà réservée pour ce créneau.' });
        }

        // Insérer la réservation
        await bddConnection.query(`
            INSERT INTO Reservation (name, phone, date, numPersonne, PlageHoraireId, tableId)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, phone, date, numPersonne, plageHoraireId, tableId]);

        res.status(201).json({ message: 'Réservation réussie' });
    } catch (error) {
        console.error('Erreur lors de la réservation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Serveur en écoute sur http://${HOST}:${PORT}`);
});
