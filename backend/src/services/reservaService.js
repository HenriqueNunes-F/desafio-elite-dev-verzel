const eventoData = require('../data/eventoData');
const reservaData = require('../data/reservaData');
const pagamentoData = require('../data/pagamentoData');
const ingressoData = require('../data/ingressoData');
const ingressoService = require('./ingressoService');

async function criarReserva(clienteId, eventoId, quantidade) {
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    const err = new Error('quantidade precisa ser um número inteiro maior que zero.');
    err.status = 400;
    throw err;
  }

  const evento = await eventoData.buscarPorId(eventoId);
  if (!evento || evento.situacao !== 'publicado') {
    const err = new Error('Evento não encontrado ou não está mais disponível.');
    err.status = 404;
    throw err;
  }

  const reservado = await eventoData.tentarReservarCapacidade(eventoId, quantidade);
  if (!reservado) {
    const err = new Error('Capacidade insuficiente para essa quantidade.');
    err.status = 409;
    throw err;
  }

  return reservaData.criar({
    eventoId,
    clienteId,
    quantidade,
    precoUnitarioCentavos: evento.preco_centavos
  });
}
async function pagarReserva(clienteId, reservaId, aprovar) {
  if (typeof aprovar !== 'boolean') {
    const err = new Error('aprovar é obrigatório e precisa ser true ou false.');
    err.status = 400;
    throw err;
  }

  const reserva = await reservaData.buscarPorId(reservaId);
  if (!reserva) {
    const err = new Error('Reserva não encontrada.');
    err.status = 404;
    throw err;
  }
  if (reserva.cliente_id !== clienteId) {
    const err = new Error('Essa reserva não é sua.');
    err.status = 403;
    throw err;
  }
  if (reserva.situacao !== 'pendente_pagamento') {
    const err = new Error(`Reserva já está com situação "${reserva.situacao}", não pode pagar de novo.`);
    err.status = 409;
    throw err;
  }

  const valorCentavos = reserva.quantidade * reserva.preco_unitario_centavos;

  if (!aprovar) {
    await pagamentoData.criar({ reservaId, situacao: 'recusado', valorCentavos });
    await reservaData.definirSituacao(reservaId, 'recusado');
    await eventoData.liberarCapacidade(reserva.evento_id, reserva.quantidade);
    return { situacao: 'recusado' };
  }

  await pagamentoData.criar({ reservaId, situacao: 'aprovado', valorCentavos });
  await reservaData.definirSituacao(reservaId, 'pago');
  const ingressos = [];
  for (let i = 0; i < reserva.quantidade; i++) {
    const ingresso = await ingressoService.emitirIngresso({
      reservaId,
      eventoId: reserva.evento_id,
      titularId: clienteId
    });
    ingressos.push(ingresso);
  }

  return { situacao: 'pago', ingressos };
}

async function cancelarReserva(clienteId, reservaId) {
  const reserva = await reservaData.buscarPorId(reservaId);
  if (!reserva) {
    const err = new Error('Reserva não encontrada.');
    err.status = 404;
    throw err;
  }
  if (reserva.cliente_id !== clienteId) {
    const err = new Error('Essa reserva não é sua.');
    err.status = 403;
    throw err;
  }
  if (reserva.situacao !== 'pendente_pagamento' && reserva.situacao !== 'pago') {
    const err = new Error(`Reserva já está com situação "${reserva.situacao}", não pode ser cancelada.`);
    err.status = 409;
    throw err;
  }

  if (reserva.situacao === 'pago') {
    await ingressoData.marcarCanceladosPorReserva(reservaId);
  }

  await reservaData.definirSituacao(reservaId, 'cancelado');
  await eventoData.liberarCapacidade(reserva.evento_id, reserva.quantidade);
  return { situacao: 'cancelado' };
}

module.exports = { criarReserva, pagarReserva, cancelarReserva };
