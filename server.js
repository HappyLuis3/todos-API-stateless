const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// SQLite database connection
const db = new sqlite3.Database('todos.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');

    // Create table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        priority TEXT DEFAULT 'low',
        isComplete INTEGER DEFAULT 0,
        isFun INTEGER DEFAULT 0
      )
    `, (err) => {
      if (err) console.error('Error creating table:', err.message);
    });
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todos
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching todos', error: err.message });
    }

    const formatted = rows.map(todo => ({
      ...todo,
      isComplete: Boolean(todo.isComplete),
      isFun: Boolean(todo.isFun)
    }));

    res.json(formatted);
  });
});

// GET one todo by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching todo', error: err.message });
    }

    if (row) {
      res.json({
        ...row,
        isComplete: Boolean(row.isComplete),
        isFun: Boolean(row.isFun)
      });
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// POST new todo
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = false } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  const query = `INSERT INTO todos (name, priority, isFun) VALUES (?, ?, ?)`;
  const values = [name, priority, isFun ? 1 : 0];

  db.run(query, values, function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error creating todo', error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      name,
      priority,
      isComplete: false,
      isFun
    });
  });
});

// DELETE todo by ID
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting todo', error: err.message });
    }

    if (this.changes > 0) {
      res.json({ message: `Todo item ${id} deleted.` });
    } else {
      res.status(404).json({ message: 'Todo item not found' });
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Todo API server running at http://localhost:${port}`);
});
