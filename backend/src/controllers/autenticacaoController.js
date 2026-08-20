const autenticacaoService = require('../services/autenticacaoService');
const usuarioData = require('../data/usuarioData');

async function entrar(req, res, next) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }
    const resultado = await autenticacaoService.entrar(email, senha);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function eu(req, res, next) {
  try {
    const usuario = await usuarioData.buscarPorId(req.usuario.id);
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { entrar, eu };
