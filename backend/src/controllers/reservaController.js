const reservaService = require('../services/reservaService');

async function criar(req, res, next) {
  try {
    const reserva = await reservaService.criarReserva(
      req.usuario.id,
      req.params.idEvento,
      req.body.quantidade
    );
    res.status(201).json({ reserva });
  } catch (err) {
    next(err);
  }
}

async function pagar(req, res, next) {
  try {
    const resultado = await reservaService.pagarReserva(req.usuario.id, req.params.id, req.body.aprovar);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function cancelar(req, res, next) {
  try {
    const resultado = await reservaService.cancelarReserva(req.usuario.id, req.params.id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, pagar, cancelar };
