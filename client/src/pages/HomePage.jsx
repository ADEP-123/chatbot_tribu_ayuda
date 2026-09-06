import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h1>Tu asistente para la declaración de renta</h1>
        <p>
          Responde unas preguntas sencillas sobre tus ingresos, bienes y movimientos del año, y te
          decimos si debes declarar renta y por qué (con base en los topes vigentes de la DIAN).
        </p>
        <p className="disclaimer">
          Esto es una recomendación orientativa, no un documento legal. Te recomendamos revisar tu
          situación con un contador o profesional tributario antes de declarar.
        </p>
        <div className="hero-actions">
          {user ? (
            user.isAdmin ? (
              <Link className="button" to="/admin/tax-years">
                Ir al panel admin
              </Link>
            ) : (
              <p className="hero-note">
                El chat estará disponible muy pronto — vuelve en unos días.
              </p>
            )
          ) : (
            <>
              <Link className="button" to="/register">
                Crear cuenta
              </Link>
              <Link className="ghost-button" to="/login">
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Conversación guiada</h3>
          <p>Un flujo de preguntas simples, paso a paso (sin jerga legal).</p>
        </div>
        <div className="feature-card">
          <h3>Reglas oficiales de la DIAN</h3>
          <p>El cálculo usa los topes de UVT vigentes, no estimaciones genéricas.</p>
        </div>
        <div className="feature-card">
          <h3>Reporte claro</h3>
          <p>Al final obtienes un resumen de si debes declarar y por qué.</p>
        </div>
      </section>
    </div>
  );
}
