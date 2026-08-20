const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const cache = new Map();

function buscarNoCache(chave) {
  const entrada = cache.get(chave);
  if (!entrada) return null;
  if (Date.now() > entrada.expiraEm) {
    cache.delete(chave);
    return null;
  }
  return entrada.valor;
}

function salvarNoCache(chave, valor) {
  cache.set(chave, { valor, expiraEm: Date.now() + CACHE_TTL_MS });
}

async function tmdbBuscar(caminho, parametros = {}) {
  const chaveApi = process.env.TMDB_API_KEY;
  if (!chaveApi) {
    const err = new Error('TMDB_API_KEY não configurada no .env do backend.');
    err.status = 500;
    throw err;
  }

  const url = new URL(`${TMDB_BASE_URL}${caminho}`);
  url.searchParams.set('api_key', chaveApi);
  url.searchParams.set('language', 'pt-BR');
  for (const [k, v] of Object.entries(parametros)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }

  const chaveCache = url.toString();
  const emCache = buscarNoCache(chaveCache);
  if (emCache) return emCache;

  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`TMDb respondeu ${res.status} para ${caminho}`);
    err.status = 502;
    throw err;
  }

  const dados = await res.json();
  salvarNoCache(chaveCache, dados);
  return dados;
}

async function buscarFilmes(consulta) {
  if (!consulta) return filmesPopulares();
  const dados = await tmdbBuscar('/search/movie', { query: consulta });
  return dados.results || [];
}

async function filmesPopulares() {
  const dados = await tmdbBuscar('/movie/popular');
  return dados.results || [];
}

async function buscarFilmePorId(tmdbId) {
  return tmdbBuscar(`/movie/${tmdbId}`);
}

module.exports = { buscarFilmes, filmesPopulares, buscarFilmePorId };
