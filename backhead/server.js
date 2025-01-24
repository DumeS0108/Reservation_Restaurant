const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3284;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());

// Connexion à la base de données MySQL
const bddConnection = mysql.createConnection({
    host: '192.168.65.219',
    user: 'site1', // Votre utilisateur MySQL
    password: 'Site1234!', // Votre mot de passe MySQL
    database: 'Restaurant', // Nom de votre base de données
});

bddConnection.connect((err) => {
    if (err) throw err;
    console.log("Connecté à la base de données !");
});

// ROUTES

// 1. Vérifier la disponibilité d'une table dans une plage horaire
app.post('/check-availability', (req, res) => {
    const { tableId, PlageHoraireId } = req.body;

    const query = `SELECT * FROM Reservation WHERE tableId = ? AND PlageHoraireId = ?`;

    db.query(query, [tableId, PlageHoraireId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification de la disponibilité :', err);
            res.status(500).json({ error: 'Erreur serveur.' });
        } else if (results.length > 0) {
            res.json({ available: false, message: 'Cette table est déjà réservée pour cette plage horaire.' });
        } else {
            res.json({ available: true, message: 'La table est disponible.' });
        }
    });
});

// 2. Créer une réservation
app.post('/reserve', (req, res) => {
    const { name, phone, date, numPersonne, PlageHoraireId, tableId } = req.body;

    // Vérifier la disponibilité avant d'insérer
    const checkQuery = `SELECT * FROM Reservation WHERE tableId = ? AND PlageHoraireId = ?`;

    bddConnection.query(checkQuery, [tableId, PlageHoraireId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification de la disponibilité :', err);
            res.status(500).json({ error: 'Erreur serveur.' });
        } else if (results.length > 0) {
            res.status(400).json({ error: 'La table est déjà réservée pour cette plage horaire.' });
        } else {
            // Insérer la réservation
            const insertQuery = `INSERT INTO Reservation (name, phone, date, numPersonne, PlageHoraireId, tableId) VALUES (?, ?, ?, ?, ?, ?)`;

            bddConnection.query(
                insertQuery,
                [name, phone, date, numPersonne, PlageHoraireId, tableId],
                (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'insertion de la réservation :', err);
                        res.status(500).json({ error: 'Erreur serveur.' });
                    } else {
                        res.status(201).json({ message: 'Réservation créée avec succès !' });
                    }
                }
            );
        }
    });
});

// 3. Récupérer toutes les réservations
app.get('/reservations', (req, res) => {
    const query = 'SELECT * FROM Reservation';

    bddConnection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des réservations :', err);
            res.status(500).json({ error: 'Erreur serveur.' });
        } else {
            res.json(results);
        }
    });
});

// 4. Supprimer une réservation
app.delete('/reservation/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Reservation WHERE id = ?';

    bddConnection.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la suppression de la réservation :', err);
            res.status(500).json({ error: 'Erreur serveur.' });
        } else if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Réservation non trouvée.' });
        } else {
            res.json({ message: 'Réservation supprimée avec succès.' });
        }
    });
});
