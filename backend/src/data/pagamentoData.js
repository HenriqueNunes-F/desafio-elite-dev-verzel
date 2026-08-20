const pool = require('../config/db');

async function criar({ reservaId, situacao, valorCentavos }) {
  const [resultado] = await pool.query(
    `INSERT INTO pagamentos (reserva_id, situacao, valor_centavos) VALUES (:reservaId, :situacao, :valorCentavos)`,
    { reservaId, situacao, valorCentavos }
  );
  const [linhas] = await pool.query('SELECT * FROM pagamentos WHERE id = :id', { id: resultado.insertId });
  return linhas[0];
}

module.exports = { criar };
