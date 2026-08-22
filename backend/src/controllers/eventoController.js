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

    let precoMaximoCentavosNumero;
    if (precoMaximoCentavos !== undefined) {
      precoMaximoCentavosNumero = Number(precoMaximoCentavos);
      if (!Number.isFinite(precoMaximoCentavosNumero) || precoMaximoCentavosNumero < 0) {
        return res.status(400).json({ error: 'precoMaximoCentavos precisa ser um número maior ou igual a zero.' });
      }
    }

    const eventos = await eventoService.listarEventosPublicos({
      busca,
      local,
      precoMaximoCentavos: precoMaximoCentavosNumero
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
