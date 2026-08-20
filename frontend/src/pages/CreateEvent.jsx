import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

// Formato que o input datetime-local espera: "AAAA-MM-DDTHH:mm" em horário
// local (sem timezone). Usado como valor mínimo selecionável, pra nem deixar
// escolher uma data passada na hora de criar o evento — o backend também
// valida isso (defesa em profundidade, o front nunca é a única barreira).
function agoraParaDatetimeLocal() {
  const agora = new Date();
  const semFusoHorario = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return semFusoHorario.toISOString().slice(0, 16);
}

// Fluxo em duas partes, como decidido no plano: Parte A escolhe o filme no
// catálogo do TMDb, Parte B preenche data/local/capacidade/preço por cima.
// Os campos do filme (title, release_date, id) vêm direto da API do TMDb —
// mantidos como o TMDb devolve, não são nomenclatura nossa.
export default function CreateEvent() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [consulta, setConsulta] = useState('');
  const [filmes, setFilmes] = useState([]);
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const [dataHora, setDataHora] = useState('');
  const [local, setLocal] = useState('');
  const [capacidadeTotal, setCapacidadeTotal] = useState('');
  const [preco, setPreco] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  async function lidarComBusca(e) {
    e.preventDefault();
    setBuscando(true);
    setErro(null);
    try {
      const { filmes } = await api.get(`/catalogo/filmes?consulta=${encodeURIComponent(consulta)}`, token);
      setFilmes(filmes);
    } catch (err) {
      setErro(err.message);
    } finally {
      setBuscando(false);
    }
  }

  async function lidarComEnvio(e) {
    e.preventDefault();
    if (!filmeSelecionado) {
      setErro('Escolha um filme do catálogo primeiro.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await api.post(
        '/eventos',
        {
          tmdbId: filmeSelecionado.id,
          dataHora,
          local,
          capacidadeTotal: Number(capacidadeTotal),
          precoCentavos: Math.round(Number(preco) * 100)
        },
        token
      );
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="page">
      <h1>Criar evento</h1>
      {erro && <p className="form-error">{erro}</p>}

      <section>
        <h2>1. Escolha um filme</h2>
        <form onSubmit={lidarComBusca} className="search-form">
          <input
            placeholder="Buscar filme (ex: Duna)"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
          />
          <button type="submit" disabled={buscando}>
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        <ul className="movie-list">
          {filmes.map((filme) => (
            <li key={filme.id}>
              <button
                type="button"
                className={filmeSelecionado?.id === filme.id ? 'movie-selected' : ''}
                onClick={() => setFilmeSelecionado(filme)}
              >
                {filme.title} {filme.release_date ? `(${filme.release_date.slice(0, 4)})` : ''}
              </button>
            </li>
          ))}
        </ul>

        {filmeSelecionado && <p>Selecionado: <strong>{filmeSelecionado.title}</strong></p>}
      </section>

      <section>
        <h2>2. Detalhes do evento</h2>
        <form onSubmit={lidarComEnvio} className="auth-form">
          <label>
            Data e hora
            <input
              type="datetime-local"
              value={dataHora}
              min={agoraParaDatetimeLocal()}
              onChange={(e) => setDataHora(e.target.value)}
              required
            />
          </label>
          <label>
            Local
            <input value={local} onChange={(e) => setLocal(e.target.value)} required />
          </label>
          <label>
            Capacidade total
            <input type="number" min="1" value={capacidadeTotal} onChange={(e) => setCapacidadeTotal(e.target.value)} required />
          </label>
          <label>
            Preço (R$)
            <input type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} required />
          </label>
          <button type="submit" disabled={enviando}>
            {enviando ? 'Criando...' : 'Publicar evento'}
          </button>
        </form>
      </section>
    </div>
  );
}
