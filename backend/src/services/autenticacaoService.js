const bcrypt = require('bcryptjs');
const usuarioData = require('../data/usuarioData');
const { assinarTokenLogin } = require('../utils/jwt');

async function entrar(email, senha) {
  const usuario = await usuarioData.buscarPorEmail(email);
  if (!usuario) {
    const err = new Error('Email ou senha inválidos.');
    err.status = 401;
    throw err;
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaCorreta) {
    const err = new Error('Email ou senha inválidos.');
    err.status = 401;
    throw err;
  }

  const token = assinarTokenLogin(usuario);
  return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel } };
}

module.exports = { entrar };
