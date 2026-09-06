import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { SunIcon, MoonIcon, AdminIcon, LogoutIcon } from './icons';

export function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Asistente tributario
        </Link>
        <div className="header-actions">
          {user?.isAdmin && (
            <Link
              className="ghost-button"
              to="/admin/tax-years"
              aria-label="Panel admin"
              title="Panel admin"
            >
              <AdminIcon />
              <span className="btn-label">Panel admin</span>
            </Link>
          )}
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          {user && (
            <button
              className="ghost-button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogoutIcon />
              <span className="btn-label">Cerrar sesión</span>
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Desarrollado por Andrés David Elizalde Peralta ·{' '}
          <a href="https://github.com/ADEP-123" target="_blank" rel="noreferrer">
            github.com/ADEP-123
          </a>
        </p>
      </footer>
    </div>
  );
}
