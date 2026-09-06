import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Loading } from '../components/Loading';
import { useToast } from '../toast/ToastContext';

export function AdminTaxYearsPage() {
  const [taxYears, setTaxYears] = useState(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    apiFetch('/api/tax-years')
      .then(setTaxYears)
      .catch((e) => setError(e.message));
  }, []);

  async function handleDelete(year) {
    if (!confirm(`¿Eliminar el año gravable ${year}?`)) return;
    try {
      await apiFetch(`/api/tax-years/${year}`, { method: 'DELETE' });
      setTaxYears((prev) => prev.filter((ty) => ty.year !== year));
      showToast(`Año gravable ${year} eliminado.`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!taxYears) return <Loading message="Cargando años gravables..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Años gravables</h1>
        <Link className="button" to="/admin/tax-years/new">
          + Nuevo año
        </Link>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>UVT</th>
              <th>Tope ingresos (UVT)</th>
              <th>Declaración</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {taxYears.map((ty) => (
              <tr key={ty.year}>
                <td data-label="Año">{ty.year}</td>
                <td data-label="UVT">${Number(ty.uvtValue).toLocaleString('es-CO')}</td>
                <td data-label="Tope ingresos (UVT)">{ty.topeIngresosUvt}</td>
                <td data-label="Declaración">
                  {new Date(ty.declarationStart).toLocaleDateString('es-CO')} –{' '}
                  {new Date(ty.declarationEnd).toLocaleDateString('es-CO')}
                </td>
                <td data-label="Acciones" className="cell-actions">
                  <Link to={`/admin/tax-years/${ty.year}`}>Editar</Link>{' '}
                  <button onClick={() => handleDelete(ty.year)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
