const pool = require('../config/db');

async function criar({ organizadorId, tmdbId, titulo, caminhoPoster, sinopse, dataHora, local, capacidadeTotal, precoCentavos }) {
  const [resultado] = await pool.query(
    `INSERT INTO eventos
       (organizador_id, tmdb_id, titulo, caminho_poster, sinopse, data_hora, local, capacidade_total, preco_centavos)
     VALUES
       (:organizadorId, :tmdbId, :titulo, :caminhoPoster, :sinopse, :dataHora, :local, :capacidadeTotal, :precoCentavos)`,
    { organizadorId, tmdbId, titulo, caminhoPoster, sinopse, dataHora, local, capacidadeTotal, precoCentavos }
  );
  return buscarPorId(resultado.insertId);
}

async function buscarPorId(id) {
  const [linhas] = await pool.query('SELECT * FROM eventos WHERE id = :id', { id });
  return linhas[0] || null;
}

async function listarPublicados({ busca, local, precoMaximoCentavos } = {}) {
  const condicoes = ["situacao = 'publicado'"];
  const parametros = {};

  if (busca) {
    condicoes.push('titulo LIKE :busca');
    parametros.busca = `%${busca}%`;
  }
  if (local) {
    condicoes.push('local LIKE :local');
    parametros.local = `%${local}%`;
  }
  if (precoMaximoCentavos !== undefined && precoMaximoCentavos !== null) {
    condicoes.push('preco_centavos <= :precoMaximoCentavos');
    parametros.precoMaximoCentavos = precoMaximoCentavos;
  }

  const [linhas] = await pool.query(
    `SELECT * FROM eventos WHERE ${condicoes.join(' AND ')} ORDER BY data_hora ASC`,
    parametros
  );
  return linhas;
}

async function listarPorOrganizador(organizadorId) {
  const [linhas] = await pool.query(
    'SELECT * FROM eventos WHERE organizador_id = :organizadorId ORDER BY data_hora DESC',
    { organizadorId }
  );
  return linhas;
}

async function cancelar(id) {
  const [resultado] = await pool.query(
    "UPDATE eventos SET situacao = 'cancelado' WHERE id = :id AND situacao = 'publicado'",
    { id }
  );
  return resultado.affectedRows === 1;
}

async function tentarReservarCapacidade(eventoId, quantidade) {
  const [resultado] = await pool.query(
    `UPDATE eventos
     SET capacidade_reservada = capacidade_reservada + :quantidade
     WHERE id = :eventoId
       AND situacao = 'publicado'
       AND capacidade_reservada + :quantidade <= capacidade_total`,
    { eventoId, quantidade }
  );
  return resultado.affectedRows === 1;
}

async function liberarCapacidade(eventoId, quantidade) {
  await pool.query(
    `UPDATE eventos SET capacidade_reservada = GREATEST(capacidade_reservada - :quantidade, 0) WHERE id = :eventoId`,
    { eventoId, quantidade }
  );
}

module.exports = { criar, buscarPorId, listarPublicados, listarPorOrganizador, cancelar, tentarReservarCapacidade, liberarCapacidade };
