const crypto = require('crypto');
const ingressoData = require('../data/ingressoData');
const { assinarQrIngresso, verificarQrIngresso } = require('../utils/jwt');

async function emitirIngresso({ reservaId, eventoId, titularId }) {
  const qrJti = crypto.randomUUID();
  const slugCompartilhamento = crypto.randomBytes(12).toString('hex');

  const ingresso = await ingressoData.criar({ reservaId, eventoId, titularId, qrJti, slugCompartilhamento });

  const tokenQr = assinarQrIngresso({ idIngresso: ingresso.id, idEvento: eventoId, jti: qrJti });
  return { ...ingresso, token_qr: tokenQr };
}

async function validarIngresso(tokenQr, idEventoEstacao, idUsuarioPortaria) {
  let payload;
  try {
    payload = verificarQrIngresso(tokenQr);
  } catch {
    return { resultado: 'invalido', motivo: 'Assinatura do QR inválida ou código malformado.' };
  }

  const ingresso = await ingressoData.buscarPorId(payload.idIngresso);
  if (!ingresso || ingresso.qr_jti !== payload.jti) {
    return { resultado: 'invalido', motivo: 'Ingresso não encontrado.' };
  }

  if (String(ingresso.evento_id) !== String(idEventoEstacao)) {
    return { resultado: 'evento_errado', motivo: 'Este ingresso é de outro evento.' };
  }

  if (ingresso.situacao === 'cancelado') {
    return { resultado: 'invalido', motivo: 'Este ingresso foi cancelado.' };
  }

  const marcado = await ingressoData.marcarUtilizadoSeValido(ingresso.id, idUsuarioPortaria);
  if (!marcado) {
    return { resultado: 'ja_utilizado', motivo: 'Este ingresso já foi validado antes.' };
  }

  return { resultado: 'valido', ingresso };
}

function anexarTokenQr(ingresso) {
  const tokenQr = assinarQrIngresso({ idIngresso: ingresso.id, idEvento: ingresso.evento_id, jti: ingresso.qr_jti });
  return { ...ingresso, token_qr: tokenQr };
}

async function apagarIngressoCancelado(titularId, ingressoId) {
  const ingresso = await ingressoData.buscarPorId(ingressoId);
  if (!ingresso) {
    const err = new Error('Ingresso não encontrado.');
    err.status = 404;
    throw err;
  }
  if (ingresso.titular_id !== titularId) {
    const err = new Error('Esse ingresso não é seu.');
    err.status = 403;
    throw err;
  }
  if (ingresso.situacao !== 'cancelado') {
    const err = new Error('Só é possível apagar ingressos já cancelados.');
    err.status = 409;
    throw err;
  }

  await ingressoData.apagarSeCancelado(ingressoId, titularId);
  return true;
}

module.exports = { emitirIngresso, validarIngresso, anexarTokenQr, apagarIngressoCancelado };
