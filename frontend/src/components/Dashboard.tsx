import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, PieChart as PieIcon, LayoutDashboard, Wallet, LogOut } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Budget {
  category: string;
  limitAmount: number;
}

interface DashboardProps {
  token: string;
  user: any;
  onLogout: () => void;
}

const COLORS = ['#facc15', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ token, user, onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchData = async () => {
    try {
      const [expRes, budRes] = await Promise.all([
        axios.get('http://localhost:5000/api/expenses', config),
        axios.get('http://localhost:5000/api/budgets', config)
      ]);
      setExpenses(expRes.data);
      setBudgets(budRes.data);
    } catch (err) {
      console.error('Fetch error', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenses', {
        amount: parseFloat(amount),
        category,
        description,
        date: new Date().toISOString().split('T')[0]
      }, config);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err) {
      alert('Error adding expense');
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, config);
      fetchData();
    } catch (err) {
      alert('Error deleting expense');
    }
  };

  const setBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/budgets', {
        category,
        limitAmount: parseFloat(limitAmount)
      }, config);
      setLimitAmount('');
      fetchData();
    } catch (err) {
      alert('Error setting budget');
    }
  };

  const chartData = Object.entries(
    expenses.reduce((acc: any, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="container">
      <header className="header">
        <div className="flex items-center">
          <Wallet size={32} color="var(--primary)" />
          <h1 style={{ marginLeft: '0.75rem' }}>SpendTracker</h1>
        </div>
        <div className="flex items-center">
          <span style={{ marginRight: '1rem', fontWeight: 500 }}>Hello, {user.username}</span>
          <button onClick={onLogout} className="btn" style={{ color: 'var(--danger)', gap: '0.5rem' }}>
            Logout <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="grid">
        <div className="card">
          <h3>Total Spending</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
            ${totalSpent.toFixed(2)}
          </p>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3>Quick Add</h3>
          <form onSubmit={addExpense} style={{ marginTop: '1rem' }}>
            <input
              type="number"
              className="input"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Food</option>
              <option>Transport</option>
              <option>Housing</option>
              <option>Entertainment</option>
              <option>Shopping</option>
              <option>Utilities</option>
            </select>
            <input
              type="text"
              className="input"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
              Add Expense <Plus size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="grid">
        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3>Budget Progress</h3>
          {budgets.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>No budgets set.</p>}
          {budgets.map((bud) => {
            const spent = expenses
              .filter((e) => e.category === bud.category)
              .reduce((sum, e) => sum + e.amount, 0);
            const percent = Math.min((spent / bud.limitAmount) * 100, 100);
            return (
              <div key={bud.category} style={{ marginTop: '1.5rem' }}>
                <div className="flex justify-between items-center">
                  <span>{bud.category}</span>
                  <span style={{ fontSize: '0.875rem' }}>
                    ${spent.toFixed(0)} / ${bud.limitAmount}
                  </span>
                </div>
                <div className="budget-progress">
                  <div
                    className={`budget-bar ${percent > 90 ? 'danger' : percent > 75 ? 'warning' : ''}`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />
          <h4>Set Budget</h4>
          <form onSubmit={setBudget} className="flex" style={{ marginTop: '1rem' }}>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Food</option>
              <option>Transport</option>
              <option>Housing</option>
              <option>Entertainment</option>
              <option>Shopping</option>
              <option>Utilities</option>
            </select>
            <input
              type="number"
              className="input"
              placeholder="Limit"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
              Set
            </button>
          </form>
        </div>

        <div className="card" style={{ gridColumn: 'span 1' }}>
          <h3>Recent Transactions</h3>
          <div style={{ marginTop: '1rem' }}>
            {expenses.map((exp) => (
              <div key={exp.id} className="expense-item">
                <div>
                  <div style={{ fontWeight: 600 }}>{exp.description}</div>
                  <span className="category-badge">{exp.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    {exp.date}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="amount negative">-${exp.amount.toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
