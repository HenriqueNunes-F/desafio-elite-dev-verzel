const eventoService = require('../services/eventoService');

async function criar(req, res, next) {
  try {
    const evento = await eventoService.criarEvento(req.usuario.id, req.body);
    res.status(201).json({ evento });
  } catch (err) {
    next(err);
  }
}

async function listarPublicos(req, res, next) {
  try {
    const { busca, local, precoMaximoCentavos } = req.query;
    const eventos = await eventoService.listarEventosPublicos({
      busca,
      local,
      precoMaximoCentavos: precoMaximoCentavos ? Number(precoMaximoCentavos) : undefined
    });
    res.json({ eventos });
  } catch (err) {
    next(err);
  }
}

async function listarMeus(req, res, next) {
  try {
    const eventos = await eventoService.listarMeusEventos(req.usuario.id);
    res.json({ eventos });
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    await eventoService.cancelarEvento(req.usuario.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listarPublicos, listarMeus, cancelar };
