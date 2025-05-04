const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error('Failed to connect to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite.');
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        priority TEXT DEFAULT 'low',
        isComplete INTEGER DEFAULT 0,
        isFun INTEGER DEFAULT 0
      )
    `);
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows.map(todo => ({
      ...todo,
      isComplete: !!todo.isComplete,
      isFun: !!todo.isFun
    })));
  });
});

app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Todo not found' });

    res.json({
      ...row,
      isComplete: !!row.isComplete,
      isFun: !!row.isFun
    });
  });
});

app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = false } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const stmt = `INSERT INTO todos (name, priority, isFun) VALUES (?, ?, ?)`;
  db.run(stmt, [name, priority, isFun ? 1 : 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      name,
      priority,
      isComplete: false,
      isFun: !!isFun
    });
  });
});

app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    if (this.changes === 0) {
      res.status(404).json({ message: 'Todo not found' });
    } else {
      res.json({ message: `Todo ${id} deleted` });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
