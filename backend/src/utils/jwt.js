const jwt = require('jsonwebtoken');

function assinarTokenLogin(usuario) {
  return jwt.sign(
    { sub: usuario.id, papel: usuario.papel, nome: usuario.nome },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
}

function verificarTokenLogin(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
function assinarQrIngresso(payload) {
  return jwt.sign(payload, process.env.QR_SECRET, { expiresIn: '1y' });
}

function verificarQrIngresso(token) {
  return jwt.verify(token, process.env.QR_SECRET);
}

module.exports = { assinarTokenLogin, verificarTokenLogin, assinarQrIngresso, verificarQrIngresso };
