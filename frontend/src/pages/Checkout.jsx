import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Checkout() {
  const { id } = useParams();
  const { token } = useAuth();
  const location = useLocation();
  const { reserva, evento } = location.state || {};
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);

  if (!reserva) {
    return (
      <div className="page">
        <p>
          Não encontrei os dados dessa reserva nessa sessão. Volte e reserve novamente.
        </p>
        <Link to="/">Voltar</Link>
      </div>
    );
  }

  const valorCentavos = reserva.quantidade * reserva.preco_unitario_centavos;

  async function lidarComPagamento(aprovar) {
    setProcessando(true);
    setErro(null);
    try {
      const dados = await api.post(`/reservas/${id}/pagar`, { aprovar }, token);
      setResultado(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  }

  // Diferente de "recusar pagamento": aqui o cliente desiste antes de sequer
  // tentar pagar, então não gera um registro de pagamento recusado — a
  // reserva só é marcada cancelada e a vaga volta pro evento.
  async function lidarComCancelamento() {
    setProcessando(true);
    setErro(null);
    try {
      const dados = await api.post(`/reservas/${id}/cancelar`, undefined, token);
      setResultado(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setProcessando(false);
    }
  }

  if (resultado?.situacao === 'pago') {
    return (
      <div className="page">
        <h1>Pagamento aprovado</h1>
        <p>{reserva.quantidade}x ingresso(s) para {evento?.titulo ?? `evento #${reserva.evento_id}`}.</p>
        <p>Total: {formatarPreco(valorCentavos)}</p>
        <p>
          <Link to="/ingressos">Ver meus ingressos</Link>
        </p>
      </div>
    );
  }

  if (resultado?.situacao === 'recusado') {
    return (
      <div className="page">
        <h1>Pagamento recusado</h1>
        <p>A vaga foi liberada de volta para o evento.</p>
        <p>
          <Link to="/">Voltar para eventos</Link>
        </p>
      </div>
    );
  }

  if (resultado?.situacao === 'cancelado') {
    return (
      <div className="page">
        <h1>Reserva cancelada</h1>
        <p>A vaga foi liberada de volta para o evento.</p>
        <p>
          <Link to="/">Voltar para eventos</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Confirmar pagamento</h1>
      <div className="checkout-summary">
        <p>
          <strong>{evento?.titulo ?? `Evento #${reserva.evento_id}`}</strong>
        </p>
        <p>Quantidade: {reserva.quantidade}</p>
        <p>Total: {formatarPreco(valorCentavos)}</p>
      </div>
      <p className="checkout-note">Pagamento simulado — nenhuma cobrança real acontece.</p>
      {erro && <p className="form-error">{erro}</p>}
      <div className="checkout-actions">
        <button onClick={() => lidarComPagamento(true)} disabled={processando}>
          Aprovar pagamento
        </button>
        <button onClick={() => lidarComPagamento(false)} disabled={processando} className="secondary">
          Recusar pagamento
        </button>
        <button onClick={lidarComCancelamento} disabled={processando} className="secondary">
          Cancelar reserva
        </button>
      </div>
    </div>
  );
}
