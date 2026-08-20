const { Router } = require('express');
const eventoController = require('../controllers/eventoController');
const reservaController = require('../controllers/reservaController');
const { requererAutenticacao, requererPapel } = require('../middleware/auth');

const router = Router();

router.get('/', eventoController.listarPublicos);

router.get('/meus', requererAutenticacao, requererPapel('organizador'), eventoController.listarMeus);
router.post('/', requererAutenticacao, requererPapel('organizador'), eventoController.criar);
router.patch('/:id/cancelar', requererAutenticacao, requererPapel('organizador'), eventoController.cancelar);

router.post('/:idEvento/reservas', requererAutenticacao, requererPapel('cliente'), reservaController.criar);

module.exports = router;
