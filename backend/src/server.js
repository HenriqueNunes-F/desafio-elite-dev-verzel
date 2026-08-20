require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rotas = require('./routes');
const tratadorDeErros = require('./middleware/errorHandler');

const app = express();

const origensPermitidas = [process.env.FRONTEND_ORIGIN, 'http://localhost:5173'].filter(Boolean);
app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', rotas);

app.use(tratadorDeErros);

const porta = process.env.PORT || 3333;
app.listen(porta, () => {
  console.log(`API rodando em http://localhost:${porta}`);
});
