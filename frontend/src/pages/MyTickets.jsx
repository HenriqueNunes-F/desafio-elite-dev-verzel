import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function formatarData(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const ROTULO_SITUACAO = {
  valido: 'Válido',
  utilizado: 'Utilizado',
  cancelado: 'Cancelado'
};

// Mesmo código que vai dentro do QR, mas como texto de verdade — pra quem
// atende na portaria colar na entrada manual se a câmera não funcionar.
function CodigoIngresso({ tokenQr }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(tokenQr);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="ticket-codigo">
      <p className="ticket-codigo-label">Código do ingresso (caso a câmera não funcione na portaria)</p>
      <code className="ticket-codigo-texto">{tokenQr}</code>
      <button type="button" onClick={copiar} className="secondary">
        {copiado ? 'Copiado!' : 'Copiar código'}
      </button>
    </div>
  );
}

function CartaoIngressoAtivo({ ingresso, aoCancelar, cancelando }) {
  return (
    <li className="ticket-card">
      <div>
        <strong>{ingresso.titulo}</strong>
        <p>{formatarData(ingresso.data_hora)} · {ingresso.local}</p>
        <p>Situação: {ROTULO_SITUACAO[ingresso.situacao] ?? ingresso.situacao}</p>
        <p>
          <Link to={`/ingressos/compartilhar/${ingresso.slug_compartilhamento}`}>Link para compartilhar</Link>
        </p>
        <CodigoIngresso tokenQr={ingresso.token_qr} />
        <button onClick={() => aoCancelar(ingresso)} disabled={cancelando} className="secondary">
          {cancelando ? 'Cancelando...' : 'Cancelar ingresso'}
        </button>
      </div>
      <div className="ticket-qr">
        <QRCode value={ingresso.token_qr} size={140} />
      </div>
    </li>
  );
}

// Utilizado e cancelado só ficam aqui — utilizado nunca pode ser apagado
// (é prova real de que a pessoa entrou no evento), cancelado pode.
function CartaoIngressoHistorico({ ingresso, aoApagar, apagando }) {
  return (
    <li className="ticket-card ticket-card-historico">
      <div>
        <strong>{ingresso.titulo}</strong>
        <p>{formatarData(ingresso.data_hora)} · {ingresso.local}</p>
        <p>Situação: {ROTULO_SITUACAO[ingresso.situacao] ?? ingresso.situacao}</p>
        {ingresso.situacao === 'utilizado' && ingresso.utilizado_em && (
          <p>Utilizado em: {formatarData(ingresso.utilizado_em)}</p>
        )}
        {ingresso.situacao === 'cancelado' && (
          <button onClick={() => aoApagar(ingresso)} disabled={apagando} className="secondary">
            {apagando ? 'Apagando...' : 'Apagar da lista'}
          </button>
        )}
      </div>
    </li>
  );
}

export default function MyTickets() {
  const { token } = useAuth();
  const [ingressos, setIngressos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [processandoId, setProcessandoId] = useState(null);

  function carregar() {
    setCarregando(true);
    api
      .get('/ingressos/meus', token)
      .then(({ ingressos }) => setIngressos(ingressos))
      .catch((err) => setErro(err.message))
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, [token]);

  async function lidarComCancelamento(ingresso) {
    const confirmado = window.confirm(
      'Cancelar este ingresso? Se você comprou mais de um junto na mesma reserva, todos são cancelados de uma vez. A vaga volta a ficar disponível para outra pessoa.'
    );
    if (!confirmado) return;

    setProcessandoId(ingresso.id);
    setErro(null);
    try {
      await api.post(`/reservas/${ingresso.reserva_id}/cancelar`, undefined, token);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function lidarComExclusao(ingresso) {
    const confirmado = window.confirm('Apagar este ingresso cancelado da lista? Essa ação não pode ser desfeita.');
    if (!confirmado) return;

    setProcessandoId(ingresso.id);
    setErro(null);
    try {
      await api.delete(`/ingressos/${ingresso.id}`, token);
      setIngressos((atual) => atual.filter((i) => i.id !== ingresso.id));
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessandoId(null);
    }
  }

  const ativos = ingressos.filter((i) => i.situacao === 'valido');
  const historico = ingressos.filter((i) => i.situacao !== 'valido');

  return (
    <div className="page">
      <header className="page-header">
        <h1>Meus ingressos</h1>
        <Link to="/">Voltar</Link>
      </header>

      {carregando && <p>Carregando ingressos...</p>}
      {erro && <p className="form-error">{erro}</p>}
      {!carregando && !erro && ingressos.length === 0 && <p>Você ainda não tem ingressos.</p>}

      {!carregando && ativos.length > 0 && (
        <>
          <h2>Ingressos ativos</h2>
          <ul className="ticket-list">
            {ativos.map((ingresso) => (
              <CartaoIngressoAtivo
                key={ingresso.id}
                ingresso={ingresso}
                aoCancelar={lidarComCancelamento}
                cancelando={processandoId === ingresso.id}
              />
            ))}
          </ul>
        </>
      )}

      {!carregando && historico.length > 0 && (
        <>
          <h2 className="ticket-historico-titulo">Histórico</h2>
          <ul className="ticket-list ticket-list-historico">
            {historico.map((ingresso) => (
              <CartaoIngressoHistorico
                key={ingresso.id}
                ingresso={ingresso}
                aoApagar={lidarComExclusao}
                apagando={processandoId === ingresso.id}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
