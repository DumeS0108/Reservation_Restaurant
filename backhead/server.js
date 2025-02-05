const express = require('express'); 
const mysql = require('mysql2');  
const cors = require('cors');

const app = express();
const PORT = 3030;
const HOST = '192.168.65.219';  

app.use(cors());
app.use(express.json());

// 📌 Connexion à la base de données
const bddConnection = mysql.createPool({
    host: '192.168.65.219',
    user: 'site1',
    password: 'Site1234!',
    database: 'Restaurant',
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

app.listen(PORT, () => {
    console.log(`🚀 Serveur à l'écoute sur http://${HOST}:${PORT}`);
});