require('dotenv').config(); // Chargement des variables

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 2846;
const HOST = process.env.HOST || '192.168.65.219';

app.use(cors());
app.use(express.json());

// 📌 Connexion à la base de données 
const bddConnection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

// 📌 Route pour récupérer les créneaux horaires
app.get('/api/plagesHoraires', async (req, res) => {
    try {
        const [rows] = await bddConnection.query('SELECT * FROM PlagesHoraires');
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer toutes les tables
app.get('/api/tables', async (req, res) => {
    try {
        const [rows] = await bddConnection.execute('SELECT * FROM Tables');
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer toutes les réservations
app.get('/api/reservations', async (req, res) => {
    try {
        const [rows] = await bddConnection.query(`
            SELECT R.id, R.name, R.phone, R.date, R.numPersonne, P.heure_debut, P.heure_fin, T.numero
            FROM Reservation R
            JOIN PlagesHoraires P ON R.plageHoraireId = P.id
            JOIN Tables T ON R.tableId = T.id
            ORDER BY R.date DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour récupérer les tables disponibles à une date et un créneau donné
app.get('/tables-disponibles/:plageHoraireId/:date', async (req, res) => {
    const { plageHoraireId, date } = req.params;

    try {
        const [rows] = await bddConnection.execute(`
            SELECT id, numero, capacite 
            FROM Tables 
            WHERE id NOT IN (
                SELECT tableId FROM Reservation 
                WHERE plageHoraireId = ? AND date = ?
            )
        `, [plageHoraireId, date]);  // 📌 Ajout du critère de date

        res.json(rows);
    } catch (error) {
        console.error("❌ Erreur SQL :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour effectuer une réservation
app.post('/api/reserver', async (req, res) => {
    try {
        const { name, phone, date, guests, plageHoraireId, tableId } = req.body;

        // Vérifier si la table est déjà réservée pour ce créneau
        const [exist] = await bddConnection.query(
            "SELECT * FROM Reservation WHERE tableId = ? AND plageHoraireId = ? AND date = ?",
            [tableId, plageHoraireId, date]
        );

        if (exist.length > 0) {
            return res.status(400).json({ error: "Cette table est déjà réservée pour ce créneau." });
        }

        // Insérer la réservation en base de données
        await bddConnection.query(`
            INSERT INTO Reservation (name, phone, date, numPersonne, plageHoraireId, tableId)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, phone, date, guests, plageHoraireId, tableId]);

        res.status(201).json({ message: "✅ Réservation réussie !" });
    } catch (error) {
        console.error("❌ Erreur lors de la réservation :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour supprimer une réservation
app.delete('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await bddConnection.query("DELETE FROM Reservation WHERE id = ?", [id]);
        res.json({ message: "✅ Réservation supprimée avec succès !" });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});

// 📌 Route pour mettre à jour une réservation
app.put('/api/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, date, numPersonne, plageHoraireId, tableId } = req.body;
    
    try {
        await bddConnection.query(
            `UPDATE Reservation 
             SET name = ?, phone = ?, date = ?, numPersonne = ?, plageHoraireId = ?, tableId = ?
             WHERE id = ?`,
            [name, phone, date, numPersonne, plageHoraireId, tableId, id]
        );
        res.json({ message: "✅ Réservation mise à jour avec succès !" });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
        res.status(500).json({ error: "Erreur interne du serveur" });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Serveur à l'écoute sur http://${HOST}:${PORT}`);
});