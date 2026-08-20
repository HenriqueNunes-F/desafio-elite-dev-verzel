
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const eventoData = require('../data/eventoData');

const SENHA_SEED = '123456';

async function inserirOuAtualizarUsuario({ nome, email, papel }) {
  const senhaHash = await bcrypt.hash(SENHA_SEED, 10);
  const [resultado] = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, papel)
     VALUES (:nome, :email, :senhaHash, :papel)
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), senha_hash = VALUES(senha_hash), papel = VALUES(papel), id = LAST_INSERT_ID(id)`,
    { nome, email, senhaHash, papel }
  );
  console.log(`  ✓ ${papel.padEnd(11)} ${email}`);
  return resultado.insertId;
}

async function inserirEventoDemo(organizadorId) {
  const titulo = 'Duna: Parte Dois';

  const [existentes] = await pool.query(
    `SELECT id FROM eventos WHERE organizador_id = :organizadorId AND titulo = :titulo LIMIT 1`,
    { organizadorId, titulo }
  );
  if (existentes.length > 0) {
    console.log(`  ✓ evento demo já existe: "${titulo}" (id ${existentes[0].id})`);
    return;
  }

  const evento = await eventoData.criar({
    organizadorId,
    tmdbId: 693134,
    titulo,
    caminhoPoster: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    sinopse: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
    dataHora: '2027-03-20 20:00:00',
    local: 'CineStar Água Verde - Sala 3',
    capacidadeTotal: 30,
    precoCentavos: 4500
  });
  console.log(`  ✓ evento demo: "${evento.titulo}" (id ${evento.id}, 30 vagas disponíveis)`);
}

async function principal() {
  console.log('Semeando usuários de teste...');
  const organizadorId = await inserirOuAtualizarUsuario({ nome: 'Ana Organizadora', email: 'organizador@teste.com', papel: 'organizador' });
  await inserirOuAtualizarUsuario({ nome: 'Carlos Cliente', email: 'cliente1@teste.com', papel: 'cliente' });
  await inserirOuAtualizarUsuario({ nome: 'Bianca Cliente', email: 'cliente2@teste.com', papel: 'cliente' });
  await inserirOuAtualizarUsuario({ nome: 'Pedro Portaria', email: 'portaria@teste.com', papel: 'portaria' });

  console.log('\nSemeando evento demo (publicado, com vagas disponíveis)...');
  await inserirEventoDemo(organizadorId);

  console.log(`\nSenha de todos os usuários de teste: ${SENHA_SEED}`);
  await pool.end();
}

principal().catch((err) => {
  console.error('Falha ao semear usuários:', err);
  process.exit(1);
});
