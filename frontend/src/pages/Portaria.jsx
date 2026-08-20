import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const ID_LEITOR = 'portaria-qr-reader';

const ROTULO_RESULTADO = {
  valido: { texto: 'Válido — pode entrar', className: 'result-ok' },
  ja_utilizado: { texto: 'Já utilizado', className: 'result-warn' },
  evento_errado: { texto: 'Evento errado', className: 'result-error' },
  invalido: { texto: 'Inválido', className: 'result-error' }
};

export default function Portaria() {
  const { token } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [idEvento, setIdEvento] = useState('');
  const [codigoManual, setCodigoManual] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [contadorValidados, setContadorValidados] = useState(0);
  const leitorRef = useRef(null);

  useEffect(() => {
    async function carregarEventos() {
      try {
        const { eventos } = await api.get('/eventos');
        setEventos(eventos);
        if (eventos.length > 0) setIdEvento(String(eventos[0].id));
      } catch (err) {
        setErro(err.message);
      }
    }
    carregarEventos();
  }, []);

  useEffect(() => {
    return () => {
      if (leitorRef.current) {
        leitorRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function rodarValidacao(tokenQr) {
    setErro(null);
    try {
      const desfecho = await api.post('/ingressos/validar', { tokenQr, idEvento }, token);
      setResultado(desfecho);
      if (desfecho.resultado === 'valido') {
        setContadorValidados((atual) => atual + 1);
      }
    } catch (err) {
      setErro(err.message);
    }
  }

  // Troca de evento muda o "quantos já entraram" pra outro evento — o
  // contador não faz sentido continuar somando entre eventos diferentes.
  function lidarComTrocaDeEvento(e) {
    setIdEvento(e.target.value);
    setContadorValidados(0);
  }

  async function iniciarEscaneamento() {
    if (!idEvento) {
      setErro('Selecione um evento antes de escanear.');
      return;
    }
    setErro(null);
    setResultado(null);
    const leitor = new Html5Qrcode(ID_LEITOR);
    leitorRef.current = leitor;
    try {
      await leitor.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (textoDecodificado) => {
          await leitor.pause(true);
          await rodarValidacao(textoDecodificado);
        },
        () => {} // ignora frames sem QR — não é erro
      );
      setEscaneando(true);
    } catch (err) {
      const motivo = err?.message || (typeof err === 'string' ? err : 'motivo desconhecido');
      setErro('Não consegui acessar a câmera: ' + motivo + '. Use a entrada manual abaixo.');
    }
  }

  async function pararEscaneamento() {
    if (leitorRef.current) {
      await leitorRef.current.stop().catch(() => {});
      leitorRef.current.clear();
      leitorRef.current = null;
    }
    setEscaneando(false);
  }

  async function lidarComEnvioManual(e) {
    e.preventDefault();
    if (!idEvento) {
      setErro('Selecione um evento antes de validar.');
      return;
    }
    await rodarValidacao(codigoManual.trim());
  }

  function escanearProximo() {
    setResultado(null);
    if (leitorRef.current) {
      leitorRef.current.resume();
    }
  }

  const infoResultado = resultado ? ROTULO_RESULTADO[resultado.resultado] : null;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Validação de ingressos — Portaria</h1>
        <Link to="/">Voltar</Link>
      </header>

      <label className="portaria-event-select">
        Evento desta estação
        <select value={idEvento} onChange={lidarComTrocaDeEvento}>
          {eventos.map((evento) => (
            <option key={evento.id} value={evento.id}>
              {evento.titulo} — {new Date(evento.data_hora).toLocaleDateString('pt-BR')}
            </option>
          ))}
        </select>
      </label>

      <p className="portaria-contador">Validados nesta sessão: {contadorValidados}</p>

      {erro && <p className="form-error">{erro}</p>}

      <div id={ID_LEITOR} className="portaria-scanner" />

      {!escaneando ? (
        <button onClick={iniciarEscaneamento}>Ligar câmera</button>
      ) : (
        <button onClick={pararEscaneamento} className="secondary">Desligar câmera</button>
      )}

      {infoResultado && (
        <div className={`portaria-result ${infoResultado.className}`}>
          <strong>{infoResultado.texto}</strong>
          {resultado.motivo && <p>{resultado.motivo}</p>}
          <button onClick={escanearProximo}>Validar próximo</button>
        </div>
      )}

      <form onSubmit={lidarComEnvioManual} className="portaria-manual-form">
        <label>
          Entrada manual (cole o código do ingresso, caso a câmera não funcione)
          <textarea
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            rows={3}
          />
        </label>
        <button type="submit">Validar código colado</button>
      </form>
    </div>
  );
}
