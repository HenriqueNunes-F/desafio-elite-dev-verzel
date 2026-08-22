const ingressoData = require('../data/ingressoData');
const ingressoService = require('../services/ingressoService');

async function listarMeus(req, res, next) {
  try {
    const ingressos = await ingressoData.listarPorTitular(req.usuario.id);
    res.json({ ingressos: ingressos.map(ingressoService.anexarTokenQr) });
  } catch (err) {
    next(err);
  }
}

async function buscarPorSlugCompartilhamento(req, res, next) {
  try {
    const ingresso = await ingressoData.buscarPorSlugCompartilhamento(req.params.slugCompartilhamento);
    if (!ingresso) {
      return res.status(404).json({ error: 'Ingresso não encontrado.' });
    }
    // Rota pública, sem autenticação: nunca devolver token_qr/qr_jti aqui —
    // isso equivaleria a entregar o ingresso funcional pra qualquer um com o
    // link. Só os dados de exibição, sem nada que passe na portaria.
    const { titulo, data_hora, local, situacao } = ingresso;
    res.json({ ingresso: { titulo, data_hora, local, situacao } });
  } catch (err) {
    next(err);
  }
}

async function validar(req, res, next) {
  try {
    const { tokenQr, idEvento } = req.body;
    if (!tokenQr || !idEvento) {
      return res.status(400).json({ error: 'tokenQr e idEvento são obrigatórios.' });
    }
    const resultado = await ingressoService.validarIngresso(tokenQr, idEvento, req.usuario.id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function apagar(req, res, next) {
  try {
    await ingressoService.apagarIngressoCancelado(req.usuario.id, req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarMeus, buscarPorSlugCompartilhamento, validar, apagar };
