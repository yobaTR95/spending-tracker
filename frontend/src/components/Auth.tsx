import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, ArrowRight } from 'lucide-react';

interface AuthProps {
  onLogin: (token: string, user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, { username, password });
      if (isLogin) {
        onLogin(res.data.token, res.data.user);
      } else {
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative' }}>
          <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#9ca3af' }} />
          <input
            type="password"
            className="input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.5rem' }}>
          {isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight size={18} />
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <span
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </span>
      </p>
    </div>
  );
};

export default Auth;
