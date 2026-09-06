import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { SunIcon, MoonIcon, LogoutIcon } from './icons';

export function AppShell() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell-full">
      <Sidebar />
      <div className="app-shell-main">
        <div className="app-shell-topbar">
          <Link to="/" className="brand">
            Asistente tributario
          </Link>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              title="Cambiar tema"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              className="ghost-button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogoutIcon />
              <span className="btn-label">Cerrar sesión</span>
            </button>
          </div>
        </div>
        <div className="app-shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
