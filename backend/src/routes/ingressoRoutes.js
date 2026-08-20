const { Router } = require('express');
const ingressoController = require('../controllers/ingressoController');
const { requererAutenticacao, requererPapel } = require('../middleware/auth');

const router = Router();

router.get('/meus', requererAutenticacao, requererPapel('cliente'), ingressoController.listarMeus);
router.post('/validar', requererAutenticacao, requererPapel('portaria'), ingressoController.validar);
router.delete('/:id', requererAutenticacao, requererPapel('cliente'), ingressoController.apagar);
router.get('/compartilhar/:slugCompartilhamento', ingressoController.buscarPorSlugCompartilhamento); // pública, sem auth

module.exports = router;
