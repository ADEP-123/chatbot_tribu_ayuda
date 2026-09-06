import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { Loading } from '../components/Loading';
import { useToast } from '../toast/ToastContext';

const COMPLETE_MARKER = 'Ya tengo todo lo que necesito';

export function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setMessages(null);
    async function init() {
      let conv;
      if (id) {
        conv = await apiFetch(`/api/conversations/${id}`);
      } else {
        conv = await apiFetch('/api/conversations', { method: 'POST' });
        navigate(`/chat/${conv.id}`, { replace: true });
      }
      setConversationId(conv.id);
      setMessages(conv.messages);
      setProfileComplete(conv.messages.some((m) => m.content.includes(COMPLETE_MARKER)));
    }
    init().catch((e) => showToast(e.message, 'error'));
  }, [id, navigate, showToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setSending(true);

    try {
      const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      setProfileComplete(res.profileComplete);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const taxYears = await apiFetch('/api/tax-years');
      if (!taxYears.length) throw new Error('No hay ningún año gravable configurado todavía.');
      const currentYear = taxYears[0].year;
      const report = await apiFetch(`/api/reports/${currentYear}/generate`, { method: 'POST' });
      navigate(`/reports/${report.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  }

  if (!messages) return <Loading message="Iniciando tu asistente..." />;

  return (
    <div className="chat-page">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
            <p>{m.content}</p>
          </div>
        ))}
        {sending && (
          <div className="chat-bubble chat-bubble-assistant chat-typing">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {profileComplete && (
        <div className="chat-complete-bar">
          <button onClick={handleGenerateReport} disabled={generating}>
            {generating ? 'Generando...' : 'Generar mi reporte'}
          </button>
        </div>
      )}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu respuesta..."
          disabled={sending}
          autoFocus
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
