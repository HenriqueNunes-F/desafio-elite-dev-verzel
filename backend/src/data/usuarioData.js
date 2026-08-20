const pool = require('../config/db');

async function buscarPorEmail(email) {
  const [linhas] = await pool.query(
    'SELECT id, nome, email, senha_hash, papel FROM usuarios WHERE email = :email',
    { email }
  );
  return linhas[0] || null;
}

async function buscarPorId(id) {
  const [linhas] = await pool.query(
    'SELECT id, nome, email, papel FROM usuarios WHERE id = :id',
    { id }
  );
  return linhas[0] || null;
}

async function criar({ nome, email, senhaHash, papel }) {
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (:nome, :email, :senhaHash, :papel)',
    { nome, email, senhaHash, papel }
  );
  return buscarPorId(resultado.insertId);
}

module.exports = {
  buscarPorEmail,
  buscarPorId,
  criar };
