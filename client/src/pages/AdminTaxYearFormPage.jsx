import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useToast } from '../toast/ToastContext';

const FIELDS = [
  { name: 'year', label: 'Año gravable', type: 'number' },
  { name: 'uvtValue', label: 'Valor UVT ($)', type: 'number' },
  { name: 'topePatrimonioUvt', label: 'Tope patrimonio (UVT)', type: 'number' },
  { name: 'topeIngresosUvt', label: 'Tope ingresos (UVT)', type: 'number' },
  { name: 'topeConsumosUvt', label: 'Tope consumos tarjeta (UVT)', type: 'number' },
  { name: 'topeComprasUvt', label: 'Tope compras y consumos (UVT)', type: 'number' },
  { name: 'topeConsignacionesUvt', label: 'Tope consignaciones (UVT)', type: 'number' },
  { name: 'sancionMinimaUvt', label: 'Sanción mínima (UVT)', type: 'number' },
  { name: 'declarationStart', label: 'Inicio de declaración', type: 'date' },
  { name: 'declarationEnd', label: 'Fin de declaración', type: 'date' },
];

function toDateInputValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export function AdminTaxYearFormPage() {
  const { year } = useParams();
  const isEditing = Boolean(year);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      apiFetch(`/api/tax-years/${year}`)
        .then((data) =>
          setForm({
            ...data,
            declarationStart: toDateInputValue(data.declarationStart),
            declarationEnd: toDateInputValue(data.declarationEnd),
          })
        )
        .catch((e) => setError(e.message));
    }
  }, [year, isEditing]);

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      delete payload.id;
      payload.declarationStart = new Date(payload.declarationStart).toISOString();
      payload.declarationEnd = new Date(payload.declarationEnd).toISOString();

      if (isEditing) {
        await apiFetch(`/api/tax-years/${year}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast(`Año gravable ${year} actualizado.`, 'success');
      } else {
        payload.year = Number(payload.year);
        await apiFetch('/api/tax-years', { method: 'POST', body: JSON.stringify(payload) });
        showToast(`Año gravable ${payload.year} creado.`, 'success');
      }
      navigate('/admin/tax-years');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="page">
      <h1>{isEditing ? `Editar año gravable ${year}` : 'Nuevo año gravable'}</h1>
      {error && <p className="error">{error}</p>}
      <form className="card" onSubmit={handleSubmit}>
        {FIELDS.map(({ name, label, type }) => (
          <label key={name}>
            {label}
            <input
              type={type}
              value={form[name] ?? ''}
              disabled={isEditing && name === 'year'}
              onChange={(e) => handleChange(name, e.target.value)}
              required
            />
          </label>
        ))}
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}
