const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./keys.db');

db.run(`CREATE TABLE IF NOT EXISTS keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT,
  status TEXT,
  hwid TEXT,
  expiry TEXT
)`);

// GERAR KEY
app.get('/generate', (req, res) => {
  const key = 'MDR-' + Math.random().toString(36).substr(2, 10).toUpperCase();

  db.run(`INSERT INTO keys (key, status) VALUES (?, ?)`,
    [key, 'active'],
    () => res.json({ key })
  );
});

// VALIDAR KEY
app.post('/validate', (req, res) => {
  const { key, hwid } = req.body;

  db.get(`SELECT * FROM keys WHERE key = ?`, [key], (err, row) => {
    if (!row) return res.json({ valid: false });

    if (row.status !== 'active') return res.json({ valid: false });

    if (!row.hwid) {
      db.run(`UPDATE keys SET hwid = ? WHERE key = ?`, [hwid, key]);
      return res.json({ valid: true });
    }

    if (row.hwid !== hwid) return res.json({ valid: false });

    res.json({ valid: true });
  });
});

// LISTAR KEYS
app.get('/keys', (req, res) => {
  db.all(`SELECT * FROM keys`, [], (err, rows) => {
    res.json(rows);
  });
});

// BLOQUEAR KEY
app.get('/block/:key', (req, res) => {
  const key = req.params.key;

  db.run(`UPDATE keys SET status = 'banned' WHERE key = ?`, [key], () => {
    res.json({ success: true });
  });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});