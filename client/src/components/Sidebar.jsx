import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useToast } from '../toast/ToastContext';
import { TrashIcon } from './icons';

export function Sidebar() {
  const [conversations, setConversations] = useState([]);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: activeConversationId } = useParams();
  const { showToast } = useToast();

  useEffect(() => {
    apiFetch('/api/conversations')
      .then(setConversations)
      .catch(() => {});
    apiFetch('/api/reports')
      .then(setReports)
      .catch(() => {});
  }, [location.pathname]);

  async function handleNewChat() {
    const conv = await apiFetch('/api/conversations', { method: 'POST' });
    setConversations((prev) => [conv, ...prev]);
    navigate(`/chat/${conv.id}`);
  }

  async function handleDeleteConversation(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación? Esta acción no se puede deshacer.')) return;
    try {
      await apiFetch(`/api/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      showToast('Conversación eliminada.', 'success');
      if (id === activeConversationId) navigate('/chat');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteReport(e, id) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      await apiFetch(`/api/reports/${id}`, { method: 'DELETE' });
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast('Reporte eliminado.', 'success');
      if (location.pathname === `/reports/${id}`) navigate('/chat');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function conversationLabel(conv) {
    const lastUserMessage = [...(conv.messages || [])].reverse().find((m) => m.role === 'user');
    return lastUserMessage?.content?.slice(0, 32) || 'Nueva conversación';
  }

  return (
    <aside className="sidebar">
      <button className="sidebar-new-chat" onClick={handleNewChat}>
        + Nuevo chat
      </button>

      <div className="sidebar-section">
        <h3>Chats</h3>
        {conversations.length === 0 && (
          <p className="sidebar-empty">Aún no tienes conversaciones.</p>
        )}
        {conversations.map((c) => (
          <div key={c.id} className="sidebar-row">
            <Link
              to={`/chat/${c.id}`}
              className={`sidebar-item ${c.id === activeConversationId ? 'sidebar-item-active' : ''}`}
            >
              {conversationLabel(c)}
            </Link>
            <button
              className="sidebar-delete"
              onClick={(e) => handleDeleteConversation(e, c.id)}
              aria-label="Eliminar conversación"
              title="Eliminar"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Reportes</h3>
        {reports.length === 0 && <p className="sidebar-empty">Aún no has generado reportes.</p>}
        {reports.map((r) => (
          <div key={r.id} className="sidebar-row">
            <Link to={`/reports/${r.id}`} className="sidebar-item">
              Reporte {new Date(r.generatedAt).toLocaleDateString('es-CO')}
            </Link>
            <button
              className="sidebar-delete"
              onClick={(e) => handleDeleteReport(e, r.id)}
              aria-label="Eliminar reporte"
              title="Eliminar"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
