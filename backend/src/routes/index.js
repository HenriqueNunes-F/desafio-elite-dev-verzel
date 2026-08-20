const { Router } = require('express');
const autenticacaoRoutes = require('./autenticacaoRoutes');
const eventoRoutes = require('./eventoRoutes');
const catalogoRoutes = require('./catalogoRoutes');
const reservaRoutes = require('./reservaRoutes');
const ingressoRoutes = require('./ingressoRoutes');

const router = Router();

router.use('/autenticacao', autenticacaoRoutes);
router.use('/eventos', eventoRoutes);
router.use('/catalogo', catalogoRoutes);
router.use('/reservas', reservaRoutes);
router.use('/ingressos', ingressoRoutes);

module.exports = router;
