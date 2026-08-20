import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function MyEvents() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [idCancelando, setIdCancelando] = useState(null);

  function carregarEventos() {
    setCarregando(true);
    api
      .get('/eventos/meus', token)
      .then(({ eventos }) => setEventos(eventos))
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }

  useEffect(carregarEventos, [token]);

  async function lidarComCancelamento(idEvento) {
    const confirmado = window.confirm(
      'Cancelar este evento? Reservas pendentes de pagamento serão canceladas automaticamente. Ingressos já vendidos continuam válidos.'
    );
    if (!confirmado) return;

    setIdCancelando(idEvento);
    setErro(null);
    try {
      await api.patch(`/eventos/${idEvento}/cancelar`, undefined, token);
      carregarEventos();
    } catch (err) {
      setErro(err.message);
    } finally {
      setIdCancelando(null);
    }
  }

  return (
    <div className="page">
      <p>
        <Link to="/">← Voltar</Link>
      </p>
      <h1>Meus eventos</h1>
      {carregando && <p>Carregando...</p>}
      {erro && <p className="form-error">{erro}</p>}
      {!carregando && eventos.length === 0 && <p>Você ainda não criou nenhum evento.</p>}
      <ul className="event-list">
        {eventos.map((evento) => (
          <li key={evento.id} className="event-card">
            <strong>{evento.titulo}</strong> — {evento.situacao === 'cancelado' ? 'cancelado' : 'publicado'}
            <p>{formatarData(evento.data_hora)} · {evento.local}</p>
            <p>{formatarPreco(evento.preco_centavos)}</p>
            <p>
              {evento.capacidade_reservada} vendidos / {evento.capacidade_total} totais
            </p>
            {evento.situacao === 'publicado' && (
              <button onClick={() => lidarComCancelamento(evento.id)} disabled={idCancelando === evento.id} className="secondary">
                {idCancelando === evento.id ? 'Cancelando...' : 'Cancelar evento'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
