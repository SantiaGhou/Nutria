import sqlite3 from 'sqlite3';
import path from 'path';


let db;

function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(path.join(__dirname, 'bot.db'), (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err);
                return reject(err);
            }
            console.log('Conectado ao banco de dados SQLite.');
         
            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_number TEXT,
                    message TEXT,
                    response TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function saveMessage(from, message, response) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO messages (from_number, message, response) VALUES (?, ?, ?)',
            [from, message, response],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

module.exports = { initializeDatabase, saveMessage };