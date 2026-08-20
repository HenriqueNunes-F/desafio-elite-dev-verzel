const { Router } = require('express');
const catalogoController = require('../controllers/catalogoController');
const { requererAutenticacao, requererPapel } = require('../middleware/auth');

const router = Router();

router.get('/filmes', requererAutenticacao, requererPapel('organizador'), catalogoController.buscar);
router.get('/filmes/:tmdbId', requererAutenticacao, requererPapel('organizador'), catalogoController.buscarPorId);

module.exports = router;
