import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/login', { username, password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login Admin</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="form-control">
          <label className="label"><span className="label-text">Username</span></label>
          <input
            className="input input-bordered"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukkan username admin"
            autoComplete="username"
            required
          />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Password</span></label>
          <input
            className="input input-bordered"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password admin"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <p className="text-error text-sm">{error}</p> : null}
        <button className={`btn btn-primary w-full`} disabled={loading}>
          {loading ? 'Memproses…' : 'Masuk' }
        </button>
      </form>
    </div>
  );
}
