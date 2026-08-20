import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// visitante = ninguém logado ainda. Vê a lista e a busca normalmente, mas em
// vez do formulário de quantidade, vê um convite pra entrar — ao clicar,
// volta pra cá depois do login (ver lidarComPedidoDeLogin no Login.jsx).
function CartaoEvento({ evento, usuario, aoReservar, aoPedirLogin }) {
  const [quantidade, setQuantidade] = useState(1);
  const [reservando, setReservando] = useState(false);
  const [erro, setErro] = useState(null);
  const disponivel = evento.capacidade_total - evento.capacidade_reservada;
  const ehCliente = usuario?.papel === 'cliente';
  const ehVisitante = !usuario;

  async function lidarComReserva(e) {
    e.preventDefault();
    setReservando(true);
    setErro(null);
    try {
      await aoReservar(evento.id, Number(quantidade));
    } catch (err) {
      setErro(err.message);
    } finally {
      setReservando(false);
    }
  }

  return (
    <li className="event-card">
      <strong>{evento.titulo}</strong>
      <p>
        {formatarData(evento.data_hora)} · {evento.local}
      </p>
      <p>{formatarPreco(evento.preco_centavos)}</p>
      <p>{disponivel} de {evento.capacidade_total} disponíveis</p>

      {ehCliente && disponivel > 0 && (
        <form onSubmit={lidarComReserva} className="reserve-form">
          <input
            type="number"
            min="1"
            max={disponivel}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <button type="submit" disabled={reservando}>
            {reservando ? 'Reservando...' : 'Reservar'}
          </button>
        </form>
      )}
      {ehVisitante && disponivel > 0 && (
        <button onClick={aoPedirLogin} className="guest-cta">
          Entrar para reservar
        </button>
      )}
      {(ehCliente || ehVisitante) && disponivel === 0 && <p className="form-error">Esgotado</p>}
      {erro && <p className="form-error">{erro}</p>}
    </li>
  );
}

export default function Home() {
  const { usuario, token, sair } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [busca, setBusca] = useState('');
  const [local, setLocal] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  async function carregarEventos() {
    setCarregando(true);
    setErro(null);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (local) params.set('local', local);
      const query = params.toString() ? `?${params.toString()}` : '';
      const { eventos } = await api.get(`/eventos${query}`);
      setEventos(eventos);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lidarComEnvioDeBusca(e) {
    e.preventDefault();
    carregarEventos();
  }

  async function lidarComReserva(idEvento, quantidade) {
    const { reserva } = await api.post(`/eventos/${idEvento}/reservas`, { quantidade }, token);
    const evento = eventos.find((e) => e.id === idEvento);
    navigate(`/reservas/${reserva.id}/pagamento`, { state: { reserva, evento } });
  }

  function lidarComPedidoDeLogin() {
    navigate('/entrar', { state: { from: '/' } });
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Plataforma de Eventos e Ingressos</h1>
        {usuario ? (
          <div>
            <span>
              {usuario.nome} ({usuario.papel})
            </span>
            <button onClick={sair}>Sair</button>
          </div>
        ) : (
          <Link to="/entrar">Entrar</Link>
        )}
      </header>

      {usuario?.papel === 'organizador' && (
        <p>
          <Link to="/eventos/novo">+ Criar evento</Link>{' '}
          <Link to="/eventos/meus">Meus eventos</Link>
        </p>
      )}
      {usuario?.papel === 'cliente' && (
        <p>
          <Link to="/ingressos">Meus ingressos</Link>
        </p>
      )}
      {usuario?.papel === 'portaria' && (
        <p>
          <Link to="/portaria">Validar ingressos</Link>
        </p>
      )}

      <form onSubmit={lidarComEnvioDeBusca} className="search-form">
        <input
          placeholder="Buscar por título"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <input
          placeholder="Local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

      {carregando && <p>Carregando eventos...</p>}
      {erro && <p className="form-error">{erro}</p>}

      {!carregando && !erro && eventos.length === 0 && <p>Nenhum evento publicado ainda.</p>}

      <ul className="event-list">
        {eventos.map((evento) => (
          <CartaoEvento
            key={evento.id}
            evento={evento}
            usuario={usuario}
            aoReservar={lidarComReserva}
            aoPedirLogin={lidarComPedidoDeLogin}
          />
        ))}
      </ul>
    </div>
  );
}
