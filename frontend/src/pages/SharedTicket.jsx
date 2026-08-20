import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useParams } from 'react-router-dom';
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

// Página pública, sem autenticação — quem tem o link (ou o QR) "tem" o
// ingresso, igual funciona em ingresso.com/sympla.
export default function SharedTicket() {
  const { slugCompartilhamento } = useParams();
  const [ingresso, setIngresso] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const { ingresso } = await api.get(`/ingressos/compartilhar/${slugCompartilhamento}`);
        setIngresso(ingresso);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [slugCompartilhamento]);

  if (carregando) return <div className="page"><p>Carregando ingresso...</p></div>;
  if (erro) return <div className="page"><p className="form-error">{erro}</p></div>;

  return (
    <div className="page">
      <h1>{ingresso.titulo}</h1>
      <p>{formatarData(ingresso.data_hora)} · {ingresso.local}</p>
      <p>Situação: {ROTULO_SITUACAO[ingresso.situacao] ?? ingresso.situacao}</p>
      {ingresso.situacao !== 'cancelado' && (
        <div className="ticket-qr">
          <QRCode value={ingresso.token_qr} size={200} />
        </div>
      )}
      {ingresso.situacao === 'valido' && <CodigoIngresso tokenQr={ingresso.token_qr} />}
    </div>
  );
}
