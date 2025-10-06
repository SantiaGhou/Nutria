const Database = require('better-sqlite3');
const path = require('path');

class DatabaseService {
  constructor() {
    const dbPath = path.join(__dirname, '../../nutri-ia.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeDatabase();
  }

  initializeDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT DEFAULT '',
        weight REAL,
        height REAL,
        age INTEGER,
        gender TEXT,
        goal TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS meals (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        food_name TEXT NOT NULL,
        calories REAL NOT NULL,
        meal_date TEXT NOT NULL DEFAULT (date('now')),
        meal_time TEXT NOT NULL DEFAULT (time('now')),
        image_analyzed INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversation_history (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reminder_settings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        reminder_time TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, meal_type)
      );

      CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, meal_date);
      CREATE INDEX IF NOT EXISTS idx_conversation_user ON conversation_history(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_reminder_settings_user ON reminder_settings(user_id);
    `);

    console.log('✅ Banco de dados SQLite inicializado');
  }

  getOrCreateUser(phoneNumber) {
    let user = this.db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber);

    if (user) {
      return user;
    }

    const insert = this.db.prepare(`
      INSERT INTO users (id, phone_number)
      VALUES (lower(hex(randomblob(16))), ?)
    `);

    const result = insert.run(phoneNumber);

    user = this.db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber);
    return user;
  }

  updateUserProfile(userId, profileData) {
    const fields = [];
    const values = [];

    Object.keys(profileData).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(profileData[key]);
    });

    fields.push('updated_at = datetime("now")');
    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);

    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  getUserProfile(phoneNumber) {
    return this.db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber);
  }

  addMeal(userId, mealData) {
    const stmt = this.db.prepare(`
      INSERT INTO meals (user_id, meal_type, food_name, calories, meal_date, meal_time, image_analyzed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      mealData.mealType,
      mealData.foodName,
      mealData.calories,
      mealData.date || new Date().toISOString().split('T')[0],
      mealData.time || new Date().toTimeString().split(' ')[0],
      mealData.imageAnalyzed ? 1 : 0
    );

    return this.db.prepare('SELECT * FROM meals WHERE rowid = ?').get(result.lastInsertRowid);
  }

  getTodayMeals(userId) {
    const today = new Date().toISOString().split('T')[0];

    return this.db.prepare(`
      SELECT * FROM meals
      WHERE user_id = ? AND meal_date = ?
      ORDER BY meal_time ASC
    `).all(userId, today);
  }

  getMealsByDateRange(userId, startDate, endDate) {
    return this.db.prepare(`
      SELECT * FROM meals
      WHERE user_id = ? AND meal_date >= ? AND meal_date <= ?
      ORDER BY meal_date DESC, meal_time DESC
    `).all(userId, startDate, endDate);
  }

  addConversationMessage(userId, role, content) {
    const stmt = this.db.prepare(`
      INSERT INTO conversation_history (user_id, role, content)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(userId, role, content);

    return this.db.prepare('SELECT * FROM conversation_history WHERE rowid = ?').get(result.lastInsertRowid);
  }

  getConversationHistory(userId, limit = 20) {
    return this.db.prepare(`
      SELECT * FROM conversation_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit).reverse();
  }

  clearOldConversationHistory(userId, keepLast = 50) {
    const allMessages = this.db.prepare(`
      SELECT id FROM conversation_history
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    if (allMessages.length > keepLast) {
      const messagesToDelete = allMessages.slice(keepLast).map(m => m.id);

      const placeholders = messagesToDelete.map(() => '?').join(',');
      this.db.prepare(`DELETE FROM conversation_history WHERE id IN (${placeholders})`).run(...messagesToDelete);
    }
  }

  setReminderSettings(userId, mealType, reminderTime) {
    const stmt = this.db.prepare(`
      INSERT INTO reminder_settings (user_id, meal_type, reminder_time, enabled)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(user_id, meal_type)
      DO UPDATE SET reminder_time = ?, enabled = 1
    `);

    stmt.run(userId, mealType, reminderTime, reminderTime);

    return this.db.prepare(`
      SELECT * FROM reminder_settings
      WHERE user_id = ? AND meal_type = ?
    `).get(userId, mealType);
  }

  getReminderSettings(userId) {
    return this.db.prepare(`
      SELECT * FROM reminder_settings
      WHERE user_id = ? AND enabled = 1
    `).all(userId);
  }

  getAllActiveReminders() {
    return this.db.prepare(`
      SELECT rs.*, u.phone_number, u.name
      FROM reminder_settings rs
      INNER JOIN users u ON rs.user_id = u.id
      WHERE rs.enabled = 1
    `).all();
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseService();
