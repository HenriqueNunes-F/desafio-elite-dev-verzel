const pool = require('../config/db');

async function criar({ eventoId, clienteId, quantidade, precoUnitarioCentavos }) {
  const [resultado] = await pool.query(
    `INSERT INTO reservas (evento_id, cliente_id, quantidade, preco_unitario_centavos, situacao)
     VALUES (:eventoId, :clienteId, :quantidade, :precoUnitarioCentavos, 'pendente_pagamento')`,
    { eventoId, clienteId, quantidade, precoUnitarioCentavos }
  );
  return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM reservas WHERE id = :id', { id });
  return linhas[0] || null;
}

async function definirSituacao(id, situacao) {
  const [resultado] = await pool.query(
    'UPDATE reservas SET situacao = :situacao WHERE id = :id',
    { id, situacao }
  );
  return resultado.affectedRows === 1;
}

async function listarPendentesPorEvento(eventoId) {
  const [linhas] = await pool.query(
    "SELECT * FROM reservas WHERE evento_id = :eventoId AND situacao = 'pendente_pagamento'",
    { eventoId }
  );
  return linhas;
}

module.exports = { criar, buscarPorId, definirSituacao, listarPendentesPorEvento };
