require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/config/db');
const usuarioData = require('../src/data/usuarioData');
const eventoData = require('../src/data/eventoData');
const reservaData = require('../src/data/reservaData');
const ingressoData = require('../src/data/ingressoData');
const ingressoService = require('../src/services/ingressoService');

let organizadorId;
let clienteId;
let portariaId;
const eventosCriadosIds = [];
const reservasCriadasIds = [];

test.before(async () => {
  const organizador = await usuarioData.buscarPorEmail('organizador@teste.com');
  const cliente = await usuarioData.buscarPorEmail('cliente1@teste.com');
  const portaria = await usuarioData.buscarPorEmail('portaria@teste.com');
  assert.ok(organizador && cliente && portaria, 'usuários semeados precisam existir (rode npm run seed antes dos testes)');
  organizadorId = organizador.id;
  clienteId = cliente.id;
  portariaId = portaria.id;
});

test.after(async () => {
  if (reservasCriadasIds.length > 0) {
    const marcadores = reservasCriadasIds.map(() => '?').join(',');
    await pool.query(`DELETE FROM pagamentos WHERE reserva_id IN (${marcadores})`, reservasCriadasIds);
    await pool.query(`DELETE FROM ingressos WHERE reserva_id IN (${marcadores})`, reservasCriadasIds);
    await pool.query(`DELETE FROM reservas WHERE id IN (${marcadores})`, reservasCriadasIds);
  }
  if (eventosCriadosIds.length > 0) {
    await pool.query(`DELETE FROM eventos WHERE id IN (${eventosCriadosIds.map(() => '?').join(',')})`, eventosCriadosIds);
  }
  await pool.end();
});

async function criarIngressoValido() {
  const evento = await eventoData.criar({
    organizadorId,
    tmdbId: 0,
    titulo: 'Evento de teste automatizado',
    caminhoPoster: null,
    sinopse: null,
    dataHora: '2030-01-01T20:00',
    local: 'Teste automatizado',
    capacidadeTotal: 10,
    precoCentavos: 100
  });
  eventosCriadosIds.push(evento.id);
  const reserva = await reservaData.criar({
    eventoId: evento.id,
    clienteId,
    quantidade: 1,
    precoUnitarioCentavos: 100
  });
  reservasCriadasIds.push(reserva.id);
  const ingresso = await ingressoService.emitirIngresso({ reservaId: reserva.id, eventoId: evento.id, titularId: clienteId });
  return { evento, ingresso };
}

test('marcarUtilizadoSeValido marca um ingresso válido como utilizado', async () => {
  const { ingresso } = await criarIngressoValido();
  const marcado = await ingressoData.marcarUtilizadoSeValido(ingresso.id, portariaId);
  assert.equal(marcado, true);

  const recarregado = await ingressoData.buscarPorId(ingresso.id);
  assert.equal(recarregado.situacao, 'utilizado');
});

test('marcarUtilizadoSeValido recusa um ingresso já utilizado', async () => {
  const { ingresso } = await criarIngressoValido();
  const primeira = await ingressoData.marcarUtilizadoSeValido(ingresso.id, portariaId);
  assert.equal(primeira, true);

  const segunda = await ingressoData.marcarUtilizadoSeValido(ingresso.id, portariaId);
  assert.equal(segunda, false, 'validar o mesmo ingresso duas vezes não pode ter sucesso as duas vezes');
});

test('marcarUtilizadoSeValido sob concorrência real: só uma de N leituras simultâneas vence', async () => {
  const { ingresso } = await criarIngressoValido();

  const tentativas = await Promise.all(
    Array.from({ length: 10 }, () => ingressoData.marcarUtilizadoSeValido(ingresso.id, portariaId))
  );

  const sucessos = tentativas.filter(Boolean).length;
  assert.equal(sucessos, 1, `exatamente 1 leitura deveria vencer, mas ${sucessos} venceram`);
});

test('validarIngresso recusa QR de outro evento (evento_errado) e QR malformado (invalido)', async () => {
  const { evento, ingresso } = await criarIngressoValido();
  const outroEvento = await eventoData.criar({
    organizadorId,
    tmdbId: 0,
    titulo: 'Outro evento',
    caminhoPoster: null,
    sinopse: null,
    dataHora: '2030-01-01T20:00',
    local: 'Teste automatizado',
    capacidadeTotal: 10,
    precoCentavos: 100
  });
  eventosCriadosIds.push(outroEvento.id);

  const tokenQr = ingressoService.anexarTokenQr(ingresso).token_qr;

  const eventoErrado = await ingressoService.validarIngresso(tokenQr, outroEvento.id, portariaId);
  assert.equal(eventoErrado.resultado, 'evento_errado');

  const malformado = await ingressoService.validarIngresso('nao-e-um-jwt', evento.id, portariaId);
  assert.equal(malformado.resultado, 'invalido');

  // O ingresso não deve ter sido consumido por nenhuma das tentativas inválidas.
  const aindaValido = await ingressoData.buscarPorId(ingresso.id);
  assert.equal(aindaValido.situacao, 'valido');
});
