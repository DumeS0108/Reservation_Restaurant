const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = 3000;
const HOST = '192.168.65.219';

app.use(cors());
app.use(express.json());

// Connexion MySQL
const bddConnection = mysql.createPool({
    host: '192.168.65.219',
    user: 'site1',
    password: 'Site1234!',
    database: 'Restaurant',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 📌 Route pour récupérer les créneaux horaires
app.get('/plages-horaires', async (req, res) => {
    try {
        const [rows] = await bddConnection.execute('SELECT * FROM PlagesHoraires');
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer toutes les tables
app.get('/tables', async (req, res) => {
    try {
        const [rows] = await bddConnection.execute('SELECT * FROM Tables');
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer les tables disponibles
app.get('/tables-disponibles/:plageHoraireId', async (req, res) => {
    const plageHoraireId = req.params.plageHoraireId;

    try {
        const [rows] = await bddConnection.execute(`
            SELECT id, numero, capacite 
            FROM Tables 
            WHERE id NOT IN (
                SELECT tableId FROM Reservation WHERE plageHoraireId = ?
            )
        `, [plageHoraireId]);

        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour effectuer une réservation
app.post('/reserver', async (req, res) => {
    const { name, phone, date, guests, plageHoraireId, tableId } = req.body;

    try {
        // Vérifier si la table est déjà réservée
        const [exist] = await bddConnection.query(
            "SELECT * FROM Reservation WHERE tableId = ? AND plageHoraireId = ? AND date = ?",
            [tableId, plageHoraireId, date]
        );

        if (exist.length > 0) {
            return res.status(400).json({ error: "Cette table est déjà réservée pour ce créneau." });
        }

        // Insérer la réservation
        await bddConnection.query(`
            INSERT INTO Reservation (name, phone, date, numPersonne, plageHoraireId, tableId)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, phone, date, guests, plageHoraireId, tableId]);

        res.status(201).json({ message: "Réservation réussie" });
    } catch (error) {
        console.error("❌ Erreur lors de la réservation :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur en écoute sur http://${HOST}:${PORT}`);
});
