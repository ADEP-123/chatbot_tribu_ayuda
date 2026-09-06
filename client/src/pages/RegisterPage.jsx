import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useToast } from '../toast/ToastContext';

function validatePasswordClient(password) {
  const errors = [];
  if (password.length < 8) errors.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('una letra mayúscula');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('un símbolo');
  return errors;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const passwordErrors = validatePasswordClient(form.password);
    if (passwordErrors.length > 0) {
      setError(`La contraseña debe tener ${passwordErrors.join(', ')}.`);
      return;
    }

    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      showToast('Cuenta creada correctamente. Ya puedes iniciar sesión.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="auth-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        {error && <p className="error">{error}</p>}
        <label>
          Nombre
          <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </label>
        <label>
          Correo
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
          />
        </label>
        <button type="submit">Registrarme</button>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
