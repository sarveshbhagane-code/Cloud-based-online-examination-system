// ============================================================
// JSON File-Based Database
// ============================================================
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  users: [],
  exams: [],
  questions: [],
  exam_attempts: [],
  exam_registrations: []
};

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) { console.error('DB load error:', e); }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Simple query-like helpers
const db = {
  data: loadDB(),
  save() { saveDB(this.data); },
  // Get all records from a table
  getAll(table) { return this.data[table] || []; },
  // Find one record
  findOne(table, predicate) { return this.data[table].find(predicate); },
  // Find many records
  findMany(table, predicate) { return this.data[table].filter(predicate); },
  // Insert a record
  insert(table, record) {
    this.data[table].push(record);
    this.save();
    return record;
  },
  // Update records
  update(table, predicate, updates) {
    const idx = this.data[table].findIndex(predicate);
    if (idx !== -1) {
      this.data[table][idx] = { ...this.data[table][idx], ...updates };
      this.save();
      return this.data[table][idx];
    }
    return null;
  },
  // Delete records
  delete(table, predicate) {
    const before = this.data[table].length;
    this.data[table] = this.data[table].filter(r => !predicate(r));
    this.save();
    return before - this.data[table].length;
  },
  // Count records
  count(table, predicate) {
    return predicate ? this.data[table].filter(predicate).length : this.data[table].length;
  }
};

module.exports = db;
