function tratadorDeErros(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const mensagem = status === 500 ? 'Erro interno do servidor.' : err.message;
  res.status(status).json({ error: mensagem });
}

module.exports = tratadorDeErros;
