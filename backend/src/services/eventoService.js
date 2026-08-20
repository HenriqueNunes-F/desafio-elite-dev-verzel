const eventoData = require('../data/eventoData');
const reservaData = require('../data/reservaData');
const ingressoData = require('../data/ingressoData');
const tmdbService = require('../services/tmdbService');

async function criarEvento(organizadorId, { tmdbId, dataHora, local, capacidadeTotal, precoCentavos }) {
  if (!tmdbId || !dataHora || !local || !capacidadeTotal || precoCentavos === undefined) {
    const err = new Error('tmdbId, dataHora, local, capacidadeTotal e precoCentavos são obrigatórios.');
    err.status = 400;
    throw err;
  }
  if (capacidadeTotal <= 0) {
    const err = new Error('capacidadeTotal precisa ser maior que zero.');
    err.status = 400;
    throw err;
  }
  if (precoCentavos < 0) {
    const err = new Error('precoCentavos não pode ser negativo.');
    err.status = 400;
    throw err;
  }

  const dataEvento = new Date(dataHora);
  if (Number.isNaN(dataEvento.getTime())) {
    const err = new Error('dataHora não é uma data válida.');
    err.status = 400;
    throw err;
  }
  if (dataEvento.getFullYear() < 1000 || dataEvento.getFullYear() > 9999) {
    const err = new Error('O ano da data precisa ter 4 dígitos.');
    err.status = 400;
    throw err;
  }
  if (dataEvento <= new Date()) {
    const err = new Error('A data do evento precisa ser no futuro.');
    err.status = 400;
    throw err;
  }

  const filme = await tmdbService.buscarFilmePorId(tmdbId);

  return eventoData.criar({
    organizadorId,
    tmdbId,
    titulo: filme.title,
    caminhoPoster: filme.poster_path,
    sinopse: filme.overview,
    dataHora,
    local,
    capacidadeTotal,
    precoCentavos
  });
}

async function listarEventosPublicos(filtros) {
  return eventoData.listarPublicados(filtros);
}

async function listarMeusEventos(organizadorId) {
  return eventoData.listarPorOrganizador(organizadorId);
}

async function cancelarEvento(organizadorId, eventoId) {
  const evento = await eventoData.buscarPorId(eventoId);
  if (!evento) {
    const err = new Error('Evento não encontrado.');
    err.status = 404;
    throw err;
  }
  if (evento.organizador_id !== organizadorId) {
    const err = new Error('Você só pode cancelar eventos que você mesmo criou.');
    err.status = 403;
    throw err;
  }
  const cancelado = await eventoData.cancelar(eventoId);
  if (!cancelado) {
    const err = new Error('Evento já estava cancelado.');
    err.status = 409;
    throw err;
  }

  const pendentes = await reservaData.listarPendentesPorEvento(eventoId);
  for (const reserva of pendentes) {
    await reservaData.definirSituacao(reserva.id, 'cancelado');
    await eventoData.liberarCapacidade(eventoId, reserva.quantidade);
  }

  await ingressoData.marcarCanceladosPorEvento(eventoId);

  return true;
}

module.exports = { criarEvento, listarEventosPublicos, listarMeusEventos, cancelarEvento };
