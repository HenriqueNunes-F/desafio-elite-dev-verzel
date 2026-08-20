const { Router } = require('express');
const autenticacaoController = require('../controllers/autenticacaoController');
const { requererAutenticacao } = require('../middleware/auth');

const router = Router();

router.post('/entrar', autenticacaoController.entrar);
router.get('/eu', requererAutenticacao, autenticacaoController.eu);

module.exports = router;
