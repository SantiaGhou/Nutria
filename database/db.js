import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Database } = sqlite3.verbose();
let db;

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db = new Database(path.join(__dirname, 'bot.db'), (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err);
                return reject(err);
            }
            console.log('Conectado ao banco de dados SQLite.');

            db.run(`
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_number TEXT,
                    message_type TEXT,
                    content TEXT,
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

async function saveMessage(from, type, content, response) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO messages (from_number, message_type, content, response) VALUES (?, ?, ?, ?)',
            [from, type, content, response],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

export { initializeDatabase, saveMessage };