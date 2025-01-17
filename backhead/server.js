const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('Serveur démarré sur le port : ' + port);
});

// Connexion à la base de données
const bddConnection = mysql.createConnection({
    host: "192.168.65.219", // IP du serveur MariaDB
    database: "Restaurant", // Nom de la base
    user: "site1", // Utilisateur avec privilèges
    password: "site1" // Mot de passe de l'utilisateur
});

bddConnection.connect((err) => {
    if (err) throw err;
    console.log("Connecté à la base de données !");
});

const Table = sequelize.define('Table', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    numero: { type: DataTypes.STRING, allowNull: false }, // ex. "T1", "T2"
    capacite: { type: DataTypes.INTEGER, allowNull: false }
});

const PlageHoraire = sequelize.define('PlageHoraire', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    debut: { type: DataTypes.TIME, allowNull: false }, // ex. "12:00"
    fin: { type: DataTypes.TIME, allowNull: false }   // ex. "14:00"
});

const Reservation = sequelize.define('Reservation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false } // Date seulement
});

// Relations
Table.hasMany(Reservation);
Reservation.belongsTo(Table);

PlageHoraire.hasMany(Reservation);
Reservation.belongsTo(PlageHoraire);
