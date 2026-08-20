import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

const CHAVE_ARMAZENAMENTO = 'elite-dev-auth';

function carregarAutenticacaoSalva() {
  try {
    const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [autenticacao, setAutenticacao] = useState(carregarAutenticacaoSalva);

  const entrar = useCallback(async (email, senha) => {
    const { token, usuario } = await api.post('/autenticacao/entrar', { email, senha });
    const proxima = { token, usuario };
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(proxima));
    setAutenticacao(proxima);
    return proxima;
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    setAutenticacao(null);
  }, []);

  const valor = {
    token: autenticacao?.token ?? null,
    usuario: autenticacao?.usuario ?? null,
    estaAutenticado: Boolean(autenticacao?.token),
    entrar,
    sair
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa ser usado dentro de <AuthProvider>.');
  return ctx;
}
