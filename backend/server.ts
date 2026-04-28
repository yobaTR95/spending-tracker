import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user: any) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// Expense Routes
app.get('/api/expenses', authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  db.all(`SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  const { amount, category, description, date } = req.body;

  db.run(`INSERT INTO expenses (userId, amount, category, description, date) VALUES (?, ?, ?, ?, ?)`,
    [userId, amount, category, description, date],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  const id = req.params.id;

  db.run(`DELETE FROM expenses WHERE id = ? AND userId = ?`, [id, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Budget Routes
app.get('/api/budgets', authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  db.all(`SELECT * FROM budgets WHERE userId = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/budgets', authenticateToken, (req, res) => {
  const userId = (req as any).user.id;
  const { category, limitAmount } = req.body;

  db.run(`INSERT OR REPLACE INTO budgets (userId, category, limitAmount) VALUES (?, ?, ?)`,
    [userId, category, limitAmount],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
