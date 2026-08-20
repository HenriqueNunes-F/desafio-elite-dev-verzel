const URL_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333/api';

// Wrapper fino sobre fetch: injeta o Bearer token automaticamente e
// normaliza erro de resposta não-OK em uma exceção com mensagem legível.
async function requisitar(caminho, { metodo = 'GET', corpo, token } = {}) {
  const cabecalhos = { 'Content-Type': 'application/json' };
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const res = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo ? JSON.stringify(corpo) : undefined
  });

  const dados = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(dados.error || `Erro ${res.status} ao chamar ${caminho}`);
  }

  return dados;
}

export const api = {
  get: (caminho, token) => requisitar(caminho, { metodo: 'GET', token }),
  post: (caminho, corpo, token) => requisitar(caminho, { metodo: 'POST', corpo, token }),
  patch: (caminho, corpo, token) => requisitar(caminho, { metodo: 'PATCH', corpo, token }),
  delete: (caminho, token) => requisitar(caminho, { metodo: 'DELETE', token })
};
