import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Loading } from '../components/Loading';

function formatMoney(v) {
  return `$${Number(v).toLocaleString('es-CO')}`;
}

export function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/api/reports/${id}`)
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="error page">{error}</p>;
  if (!report) return <Loading message="Cargando tu reporte..." />;

  return (
    <div className="report-page-scroll">
      <div className="page report-page">
        <div
          className={`report-verdict ${report.debeDeclarar ? 'report-verdict-yes' : 'report-verdict-no'}`}
        >
          <h1>{report.debeDeclarar ? 'Sí debes declarar renta' : 'No debes declarar renta'}</h1>
          {report.fechaLimite && (
            <p>
              Fecha límite:{' '}
              {new Date(report.fechaLimite).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>

        <section className="report-section">
          <h2>Motivos</h2>
          {report.motivos.length === 0 ? (
            <p className="text-secondary">
              No superaste ninguno de los topes evaluados para declaración obligatoria.
            </p>
          ) : (
            <ul className="report-motivos">
              {report.motivos.map((m) => (
                <li key={m.criterio}>
                  <span>{m.label}</span>
                  {m.valorDeclarado !== undefined && (
                    <span className="report-motivo-detail">
                      {formatMoney(m.valorDeclarado)} (tope: {formatMoney(m.topePesos)})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        {report.debeDeclarar && report.montoEstimado != null && (
          <section className="report-section report-estimate">
            <h2>Estimación aproximada del impuesto</h2>
            <p className="report-estimate-amount">{formatMoney(report.montoEstimado)}</p>
            <p className="report-estimate-note">
              Esta cifra aplica la tarifa progresiva del Artículo 241 del Estatuto Tributario
              directamente sobre tus ingresos brutos, sin restar deducciones, rentas exentas ni
              retenciones ya practicadas <b>(el valor real a pagar casi siempre es menor)</b>.
              Consulta a un contador para el cálculo exacto.
            </p>
          </section>
        )}
        {report.camposFaltantes?.length > 0 && (
          <section className="report-section report-warning">
            <h2>Ten en cuenta</h2>
            <p>Estos datos quedaron sin confirmar y se asumieron en cero para este cálculo:</p>
            <ul>
              {report.camposFaltantes.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="report-disclaimer">
          Esta es una recomendación orientativa generada automáticamente, no un documento legal. Te
          recomendamos revisar tu situación con un contador o profesional tributario antes de
          declarar.
        </p>
      </div>
    </div>
  );
}
