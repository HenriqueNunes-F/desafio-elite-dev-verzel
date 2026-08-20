
require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const usuarioData = require('../src/data/usuarioData');
const eventoData = require('../src/data/eventoData');

let organizadorId;
const eventosCriadosIds = [];

test.before(async () => {
  const organizador = await usuarioData.buscarPorEmail('organizador@teste.com');
  assert.ok(organizador, 'usuário organizador@teste.com precisa existir (rode npm run seed antes dos testes)');
  organizadorId = organizador.id;
});


test.after(async () => {
  if (eventosCriadosIds.length > 0) {
    await pool.query(`DELETE FROM eventos WHERE id IN (${eventosCriadosIds.map(() => '?').join(',')})`, eventosCriadosIds);
  }
  await pool.end();
});

async function criarEventoDeTeste(capacidadeTotal) {
  const evento = await eventoData.criar({
    organizadorId,
    tmdbId: 0,
    titulo: 'Evento de teste automatizado',
    caminhoPoster: null,
    sinopse: null,
    dataHora: '2030-01-01T20:00',
    local: 'Teste automatizado',
    capacidadeTotal,
    precoCentavos: 100
  });
  eventosCriadosIds.push(evento.id);
  return evento;
}

test('tentarReservarCapacidade recusa reserva que estoura a capacidade', async () => {
  const evento = await criarEventoDeTeste(1);

  const primeira = await eventoData.tentarReservarCapacidade(evento.id, 1);
  assert.equal(primeira, true, 'a primeira reserva da única vaga deveria ter sucesso');

  const segunda = await eventoData.tentarReservarCapacidade(evento.id, 1);
  assert.equal(segunda, false, 'a segunda reserva não deveria conseguir a vaga já ocupada');

  const final = await eventoData.buscarPorId(evento.id);
  assert.equal(final.capacidade_reservada, 1, 'capacidade reservada não pode passar do total');
});

test('tentarReservarCapacidade sob concorrência real: só uma de N tentativas simultâneas vence', async () => {
  const evento = await criarEventoDeTeste(1);

  
  const tentativas = await Promise.all(
    Array.from({ length: 10 }, () => eventoData.tentarReservarCapacidade(evento.id, 1))
  );

  const sucessos = tentativas.filter(Boolean).length;
  assert.equal(sucessos, 1, `exatamente 1 tentativa deveria vencer, mas ${sucessos} venceram`);

  const final = await eventoData.buscarPorId(evento.id);
  assert.equal(final.capacidade_reservada, 1, 'capacidade final não pode ultrapassar o total mesmo sob concorrência');
});

test('liberarCapacidade devolve a vaga e nunca fica negativa', async () => {
  const evento = await criarEventoDeTeste(5);

  await eventoData.tentarReservarCapacidade(evento.id, 3);
  await eventoData.liberarCapacidade(evento.id, 3);
  const depoisDeLiberar = await eventoData.buscarPorId(evento.id);
  assert.equal(depoisDeLiberar.capacidade_reservada, 0);

  await eventoData.liberarCapacidade(evento.id, 10);
  const depoisDeLiberarDeNovo = await eventoData.buscarPorId(evento.id);
  assert.equal(depoisDeLiberarDeNovo.capacidade_reservada, 0);
});
