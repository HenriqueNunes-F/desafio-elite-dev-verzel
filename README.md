# Plataforma de Eventos e Ingressos — Desafio Elite Dev (Verzel)

Plataforma onde um organizador publica eventos (a partir de um catálogo de filmes via TMDb) e um cliente reserva, paga (simulado) e recebe um ingresso com QR code. A portaria valida o ingresso na entrada.

Ver decisões de arquitetura e o raciocínio por trás delas em [`docs/plan.md`](docs/plan.md) e o registro de uso de IA em [`AI-USAGE.md`](AI-USAGE.md).

**Deploy:** [desafio-elite-dev-verzel.vercel.app](https://desafio-elite-dev-verzel.vercel.app) (front) · [desafio-elite-dev-verzel-api.onrender.com](https://desafio-elite-dev-verzel-api.onrender.com) (API) — plano free do Render hiberna após 15min sem uso; a primeira requisição depois disso pode levar ~50s pra responder.

## Stack

- **Back-end:** Node.js + Express, MySQL (via `mysql2`, sem ORM), JWT para autenticação.
- **Front-end:** React + Vite, React Router, `react-qr-code` (gerar QR) e `html5-qrcode` (ler QR pela câmera).
- **API externa:** [TMDb](https://developer.themoviedb.org/docs) para o catálogo de filmes.

## Status atual (em construção)

- [x] Estrutura do projeto (backend em camadas + frontend)
- [x] Schema do banco (`backend/src/db/schema.sql`)
- [x] Autenticação JWT com 3 papéis (organizador, cliente, portaria)
- [x] Frontend: login + roteamento protegido por papel
- [x] Catálogo TMDb (proxy + cache) + criação de evento pelo organizador (com validação de data: precisa ser real, ano de 4 dígitos, e no futuro — bloqueado no formulário e no backend)
- [x] Listagem pública de eventos com busca por título/local
- [x] Painel "Meus eventos" do organizador (contagem vendidos/disponíveis)
- [x] Reserva + capacidade atômica (sem overselling, testado sob concorrência real) + pagamento simulado
- [x] Ingresso com QR assinado + "Meus Ingressos" + link público de compartilhamento
- [x] Validação na portaria: leitura de QR por câmera + entrada manual, 4 estados (válido/já utilizado/evento errado/inválido)
- [x] Cancelamento de reserva pelo próprio cliente, em qualquer momento — antes de pagar (Checkout) ou depois, já com ingresso emitido ("Meus Ingressos") — sempre devolve a vaga pro evento; ingresso apagável da lista depois de cancelado
- [x] Cancelamento de evento com devolução de estoque (reservas pendentes são canceladas + capacidade liberada, e ingressos já emitidos daquele evento também passam a "cancelado")
- [x] Blindagem de autorização entre papéis (testado: cliente/portaria batendo em rotas de organizador, organizador em rota de portaria, cliente cancelando reserva de outro cliente — todos 403; sem token — 401)
- [x] Testes automatizados nos dois pontos de maior risco: corrida de capacidade e máquina de estados do ticket (`backend/test/`, `npm test`)
- [x] Passe de responsividade (header, tela da portaria testada em viewport de celular)
- [x] Deploy — frontend na Vercel, backend no Render, banco MySQL no Aiven (link no topo deste README)

## Como rodar localmente

### Pré-requisitos
- Node.js 20+ e npm
- MySQL 8 rodando localmente (ou acessível via rede)

### 1. Banco de dados

```bash
mysql -u SEU_USUARIO -p < backend/src/db/schema.sql
```

Isso cria o banco `elite_dev_ingressos` e todas as tabelas.

### 2. Back-end

```bash
cd backend
cp .env.example .env
# edite .env com as credenciais do seu MySQL e uma chave da API do TMDb
npm install
npm run seed   # cria os usuários de teste (ver tabela abaixo)
npm run dev    # sobe em http://localhost:3333
```

Testes automatizados (`node --test`, sem framework extra) cobrem os dois pontos de maior risco do desafio — nunca vender a mesma vaga duas vezes e nunca validar o mesmo ingresso duas vezes — inclusive sob concorrência real (10 tentativas simultâneas). Rodam contra o banco de verdade (mesmo padrão do projeto, sem mocks) e limpam os dados de teste que criam:

```bash
cd backend
npm test
```

### 3. Front-end

```bash
cd frontend
npm install
npm run dev    # sobe em http://localhost:5173
```

## Usuários de teste (seed)

Todos com a senha `123456`.

| Papel | Email |
|-------|-------|
| Organizador | organizador@teste.com |
| Cliente | cliente1@teste.com |
| Cliente | cliente2@teste.com |
| Portaria | portaria@teste.com |

O seed também publica um evento de demonstração ("Duna: Parte Dois", 30 vagas disponíveis) pelo organizador de teste, para dar pra percorrer o fluxo de reserva → pagamento → ingresso → validação sem precisar cadastrar nada do zero.

## Decisões de arquitetura (resumo)

- **Sem ORM**: SQL direto com `mysql2`, para deixar visível a modelagem de dados.
- **Sem mapa de assentos**: reserva por quantidade ("pista"), para entregar o fluxo completo simples antes de qualquer coisa mais sofisticada.
- **Capacidade sem overselling**: `UPDATE` condicional atômico (`WHERE capacidade_reservada + :qtd <= capacidade_total`), não leitura-depois-escrita — evita corrida entre duas reservas simultâneas.
- **Código em português**: variáveis, funções, colunas do banco e rotas da API seguem o mesmo padrão do [Sistema Veterinário](https://github.com/HenriqueNunes-F/sistema-veterinario) — só ficam em inglês palavras-chave da linguagem, pacotes npm, claims padrão do JWT (RFC 7519) e os campos que a API do TMDb devolve.
- **QR não forjável**: JWT assinado com um secret dedicado (`QR_SECRET`), diferente do secret de login.
- **Bearer token em vez de cookie httpOnly**: front e back ficam em origens diferentes no deploy (Vercel/Render), e cookie cross-origin exigiria configuração extra sem ganho real para este escopo.
- **Tela principal pública, sem login**: navegação e busca pelos eventos publicados é um requisito de Front-End do enunciado, não uma funcionalidade de conta de cliente — segue o mesmo padrão do ingresso.com/Sympla, onde qualquer visitante navega e busca livremente. Login só é exigido no momento de reservar de verdade; um visitante que clica "Reservar" é redirecionado pro login e volta automaticamente pra onde estava.

Detalhamento completo em [`docs/plan.md`](docs/plan.md).

## Limitações conhecidas

_Esta seção será atualizada ao longo da semana com qualquer coisa que não funcione conforme o esperado, como pede o enunciado._

- A leitura de QR por câmera depende de permissão do navegador e de um dispositivo de câmera disponível; sem isso, a tela de portaria mostra o motivo do erro e cai para a entrada manual (colar o conteúdo do QR), que passa pelo mesmo endpoint de validação. Pra isso funcionar de verdade, "Meus Ingressos" mostra o código do ingresso como texto (com botão de copiar), não só embutido na imagem do QR.
- Cancelar uma reserva paga (ou o evento inteiro) marca o ingresso como "cancelado" e devolve a vaga, mas não existe fluxo de estorno de dinheiro de verdade — o pagamento já era simulado desde o início, então não há valor real a devolver.
- Cancelar um ingresso de uma reserva com mais de uma unidade cancela a compra inteira junto (todos os ingressos daquela reserva) — não dá pra cancelar só uma unidade de uma compra de várias.
- Deploy ainda não realizado.

## Além do enunciado

O enunciado convida a ir além do pedido quando fizer sentido ("se você olhar a proposta e pensar 'isso ficaria melhor com tal coisa', faça e conte por quê"). O que foi adicionado além do mínimo:

- **Cancelamento cobre ingresso já pago, não só reserva pendente.** O enunciado pede cancelamento; a implementação foi além de "desistir antes de pagar" e cobre também "me arrependi depois de já ter ingresso emitido" — porque na prática esse é o caso mais comum de cancelamento (o cliente já efetuou a compra).
- **Cancelar um evento cascateia para os ingressos já emitidos.** Sem isso, um ingresso de um evento cancelado pelo organizador continuaria aparecendo como "válido" pro cliente e passaria na portaria — um bug de consistência real, não só uma lacuna de feature.
- **Código do ingresso como texto copiável, além do QR.** Pensando no cenário real de a câmera falhar ou não existir — a entrada manual da portaria só funciona de verdade se o cliente tiver como copiar o código de algum lugar, não só ver a imagem do QR.
- **"Meus Ingressos" dividido em ativos e histórico, com contador de validações por sessão na portaria.** Sem isso, ingressos utilizados/cancelados ficariam misturados com os válidos na mesma lista, dificultando a leitura rápida que a portaria precisa ter numa fila de verdade.
- **Validação de data do evento nos dois lados (form + backend).** O enunciado não pede explicitamente, mas deixar criar evento no passado é uma inconsistência óbvia que um teste manual simples revela — vale corrigir antes de entregar.
- **Home pública, sem exigir login para navegar e buscar eventos.** O enunciado descreve navegação/busca como requisito geral de Front-End, não como funcionalidade de conta — replicando o comportamento real de plataformas como ingresso.com/Sympla, onde qualquer visitante navega livremente e só precisa logar para reservar de verdade.

## Uso de IA

Este projeto foi construído com apoio do Claude Code, com uso e decisões documentados em [`AI-USAGE.md`](AI-USAGE.md).
