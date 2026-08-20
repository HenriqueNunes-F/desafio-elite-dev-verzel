const pool = require('../config/db');

async function criar({ reservaId, eventoId, titularId, qrJti, slugCompartilhamento }) {
  const [resultado] = await pool.query(
    `INSERT INTO ingressos (reserva_id, evento_id, titular_id, qr_jti, slug_compartilhamento, situacao)
     VALUES (:reservaId, :eventoId, :titularId, :qrJti, :slugCompartilhamento, 'valido')`,
    { reservaId, eventoId, titularId, qrJti, slugCompartilhamento }
  );
  return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM ingressos WHERE id = :id', { id });
  return linhas[0] || null;
}

async function buscarPorSlugCompartilhamento(slugCompartilhamento) {
  const [linhas] = await pool.query(
    `SELECT i.*, e.titulo, e.data_hora, e.local
     FROM ingressos i
     JOIN eventos e ON e.id = i.evento_id
     WHERE i.slug_compartilhamento = :slugCompartilhamento`,
    { slugCompartilhamento }
  );
  return linhas[0] || null;
}

async function listarPorTitular(titularId) {
  const [linhas] = await pool.query(
    `SELECT i.*, e.titulo, e.data_hora, e.local
     FROM ingressos i
     JOIN eventos e ON e.id = i.evento_id
     WHERE i.titular_id = :titularId
     ORDER BY i.criado_em DESC`,
    { titularId }
  );
  return linhas;
}

async function marcarUtilizadoSeValido(id, utilizadoPorId) {
  const [resultado] = await pool.query(
    `UPDATE ingressos SET situacao = 'utilizado', utilizado_em = NOW(), utilizado_por = :utilizadoPorId
     WHERE id = :id AND situacao = 'valido'`,
    { id, utilizadoPorId }
  );
  return resultado.affectedRows === 1;
}

async function marcarCanceladosPorReserva(reservaId) {
  await pool.query(
    `UPDATE ingressos SET situacao = 'cancelado' WHERE reserva_id = :reservaId AND situacao = 'valido'`,
    { reservaId }
  );
}

async function marcarCanceladosPorEvento(eventoId) {
  await pool.query(
    `UPDATE ingressos SET situacao = 'cancelado' WHERE evento_id = :eventoId AND situacao = 'valido'`,
    { eventoId }
  );
}

async function apagarSeCancelado(id, titularId) {
  const [resultado] = await pool.query(
    `DELETE FROM ingressos WHERE id = :id AND titular_id = :titularId AND situacao = 'cancelado'`,
    { id, titularId }
  );
  return resultado.affectedRows === 1;
}

module.exports = {
  criar,
  buscarPorId,
  buscarPorSlugCompartilhamento,
  listarPorTitular,
  marcarUtilizadoSeValido,
  marcarCanceladosPorReserva,
  marcarCanceladosPorEvento,
  apagarSeCancelado
};
