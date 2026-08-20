const tmdbService = require('../services/tmdbService');

async function buscar(req, res, next) {
  try {
    const { consulta } = req.query;
    const filmes = await tmdbService.buscarFilmes(consulta);
    res.json({ filmes });
  } catch (err) {
    next(err);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const filme = await tmdbService.buscarFilmePorId(req.params.tmdbId);
    res.json({ filme });
  } catch (err) {
    next(err);
  }
}

module.exports = { buscar, buscarPorId };
