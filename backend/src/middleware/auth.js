const { verificarTokenLogin } = require('../utils/jwt');

function requererAutenticacao(req, res, next) {
  const header = req.headers.authorization || '';
  const [esquema, token] = header.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token ausente ou mal formatado.' });
  }

  try {
    const payload = verificarTokenLogin(token);
    req.usuario = { id: payload.sub, papel: payload.papel, nome: payload.nome };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

function requererPapel(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({ error: 'Seu papel não tem permissão para esta ação.' });
    }
    next();
  };
}

module.exports = { requererAutenticacao, requererPapel };
