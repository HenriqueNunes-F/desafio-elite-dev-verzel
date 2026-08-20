const { Router } = require('express');
const reservaController = require('../controllers/reservaController');
const { requererAutenticacao, requererPapel } = require('../middleware/auth');

const router = Router();

router.post('/:id/pagar', requererAutenticacao, requererPapel('cliente'), reservaController.pagar);
router.post('/:id/cancelar', requererAutenticacao, requererPapel('cliente'), reservaController.cancelar);

module.exports = router;
